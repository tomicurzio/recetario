/* ================= store ================= */
const S={recipes:[],state:{},ready:false,mode:"local",slow:false,readOnly:false};
let recCol=null,stateRef=null;
const LS="recetario.v1";
function lsLoad(){try{return JSON.parse(localStorage.getItem(LS)||"{}")}catch(e){return{}}}
function lsSave(){try{localStorage.setItem(LS,JSON.stringify({recipes:S.recipes,state:S.state}))}catch(e){}}
const queues={};
function serial(key,fn){const p=(queues[key]||Promise.resolve()).then(fn,fn);queues[key]=p.catch(()=>{});return p;}
function onWriteErr(e){
  const c=e&&e.code;
  if(c==="quota_exceeded")toast("No hay más lugar para recetas nuevas. Borrá alguna para seguir.");
  else if(c==="invalid_argument"&&!S.readOnly){S.readOnly=true;toast("No tenés permiso para guardar acá.");}
  else toast("No se pudo guardar. Probá de nuevo.");
}
async function putRecipe(r){
  r.updatedAt=Date.now();
  const i=S.recipes.findIndex(x=>x.id===r.id);
  if(i>=0)S.recipes[i]=r;else S.recipes.push(r);
  render();
  if(S.mode==="local"){lsSave();return true;}
  try{await serial(r.id,()=>recCol.doc(r.id).set(clone(r)));return true}catch(e){
    if(e&&e.code==="unavailable"){await new Promise(z=>setTimeout(z,600+Math.random()*600));try{await recCol.doc(r.id).set(clone(r));return true}catch(e2){onWriteErr(e2);return false}}
    onWriteErr(e);return false;}
}
async function delRecipe(id){
  S.recipes=S.recipes.filter(x=>x.id!==id);render();
  if(S.mode==="local"){lsSave();return}
  try{await serial(id,()=>recCol.doc(id).delete())}catch(e){onWriteErr(e)}
}
async function setState(patch){
  S.state=Object.assign({},S.state,patch);
  for(const k in patch)if(patch[k]===null)delete S.state[k];
  if(S.mode==="local"){lsSave();return}
  try{await serial("_state",()=>stateRef.set(clone(S.state)))}catch(e){onWriteErr(e)}
}
async function initStore(){
  const C=window.claude;
  let db=null,user=null,uid=null;
  try{if(C&&C.use){[db,user]=await Promise.all([C.use("db"),C.use("user")]);if(user)uid=await user.id();}}catch(e){}
  if(!db||!uid){
    S.mode="local";const d=lsLoad();S.recipes=d.recipes||[];S.state=d.state||{};S.ready=true;render();return;
  }
  S.mode="db";
  const base=db.doc("data/users/"+uid+"/profile");
  recCol=base.collection("recipes");
  stateRef=db.doc("data/users/"+uid+"/state");
  const timer=setTimeout(()=>{if(!S.confirmed){S.slow=true;S.ready=true;render();}},10000);
  recCol.onSnapshot(snap=>{
    S.recipes=snap.docs.map(d=>Object.assign({},d.data(),{id:d.id}));
    S.ready=true;
    if(!snap.metadata.fromCache){S.confirmed=true;S.slow=false;clearTimeout(timer);}
    render();
  },err=>{clearTimeout(timer);S.ready=true;S.slow=true;render();});
  stateRef.onSnapshot(s=>{S.state=s.exists?Object.assign({},s.data()):{};render();},()=>{});
}

/* ================= router ================= */
let stack=[{n:"home"}];
const cur=()=>stack[stack.length-1];
function go(n,p){stack.push(Object.assign({n},p||{}));scrollTo(0,0);render();}
function back(){if(stack.length>1)stack.pop();scrollTo(0,0);render();}
function reset(n,p){stack=[{n:"home"}];if(n&&n!=="home")stack.push(Object.assign({n},p||{}));scrollTo(0,0);render();}
function replace(n,p){stack[stack.length-1]=Object.assign({n},p||{});scrollTo(0,0);render();}
const getR=id=>S.recipes.find(r=>r.id===id);

/* ================= helpers: quantities ================= */
const VULG={"½":.5,"¼":.25,"¾":.75,"⅓":1/3,"⅔":2/3};
function parseQty(text){
  const t=String(text||"").trim();
  const m=t.match(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?\s*[½¼¾⅓⅔]?|[½¼¾⅓⅔])(?=\s|[a-zA-Z]|$)/);
  if(!m)return null;
  let s=m[1].trim(),v=0;
  const vul=s.match(/[½¼¾⅓⅔]/);if(vul){v+=VULG[vul[0]];s=s.replace(vul[0],"").trim();}
  if(s){
    if(/\s/.test(s)&&s.includes("/")){const[a,b]=s.split(/\s+/);const[n,d]=b.split("/");v+=+a+(+n/+d);}
    else if(s.includes("/")){const[n,d]=s.split("/");v+=+n/+d;}
    else v+=parseFloat(s.replace(",","."));
  }
  return{v,rest:t.slice(m[0].length)};
}
function fmtQty(v){
  if(v>=10)return String(Math.round(v));
  const whole=Math.floor(v+1e-9),fr=v-whole;
  const opts=[[0,""],[.25,"¼"],[1/3,"⅓"],[.5,"½"],[2/3,"⅔"],[.75,"¾"],[1,""]];
  let best=opts[0],bd=9;for(const o of opts){const d=Math.abs(fr-o[0]);if(d<bd){bd=d;best=o;}}
  let w=whole+(best[0]===1?1:0);const f=best[0]===1?"":best[1];
  if(bd>.06&&v<10){return (Math.round(v*10)/10).toString().replace(".",",");}
  if(!w&&!f)return (Math.round(v*100)/100).toString().replace(".",",");
  return (w?w:"")+(w&&f?" ":"")+f;
}
function scaleIng(text,factor){
  const p=parseQty(text);
  if(!p||factor===1)return splitIng(text);
  const w=p.rest.trim().split(/\s+/),n=unitLen(p.rest);let unit=w.slice(0,n).join(" ");let v=p.v*factor;
  const u=norm(unit);
  if(/^(g|gr|grs|gramos?)$/.test(u)&&v>=1000){v=v/1000;unit="kg";}
  else if(/^(ml|cc)$/.test(u)&&v>=1000){v=v/1000;unit="l";}
  let q;
  if(n&&/^(g|gr|grs|gramos?|ml|cc)$/.test(norm(unit))&&v>=100)q=String(Math.round(v/5)*5);
  else if(n&&/^(kg|l)$/.test(unit)&&v<10)q=(Math.round(v*10)/10).toString().replace(".",",");
  else q=fmtQty(v);
  return{q:(q+" "+unit).trim(),name:w.slice(n).join(" ").replace(/^de\s+/i,"")};
}
const UNITS=/^(g|gr|grs|gramos?|kg|kilos?|ml|cc|l|lt|litros?|cdas?|cditas?|cucharadas?|cucharaditas?|tazas?|pizcas?|tz|chorritos?|vasos?)$/i;
function unitLen(rest){const w=rest.trim().split(/\s+/);return w[0]&&UNITS.test(w[0].replace(/\.$/,""))?1:0;}
function splitIng(text){
  const p=parseQty(text);if(!p)return{q:"",name:text};
  const n=unitLen(p.rest),w=p.rest.trim().split(/\s+/);
  const qstr=String(text).trim().slice(0,String(text).trim().length-p.rest.length).trim();
  return{q:(qstr+" "+w.slice(0,n).join(" ")).trim(),name:w.slice(n).join(" ").replace(/^de\s+/i,"")};
}
function ingKey(text){const s=splitIng(text).name;const w=norm(s).split(/[ ,(]/).filter(x=>x.length>2&&!["de","del","con","para","los","las","una","uno"].includes(x));return w[0]||"";}
function needsFor(r,stepText){
  const t=norm(stepText);const out=[];
  for(const ing of r.ingredients||[]){const k=ingKey(ing);if(!k)continue;const stem=k.length>4?k.slice(0,k.length-1):k;if(t.includes(stem))out.push(splitIng(ing).name.split(/[,(]/)[0].trim());}
  return [...new Set(out)].slice(0,5);
}
function stepMinutes(text){
  const m=norm(text).match(/(\d+(?:[.,]\d+)?)\s*(?:a\s*\d+\s*)?(minutos?|min|horas?|hs?)\b/);
  if(!m)return 0;let v=parseFloat(m[1].replace(",","."));if(/^h/.test(m[2]))v*=60;return Math.round(v)>0&&v<=600?Math.round(v):0;
}

