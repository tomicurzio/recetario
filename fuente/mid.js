/* ================= store (Firebase) ================= */
const FB_CFG={
  apiKey:"AIzaSyCRLIOHduLfwUhmIrmlLvmXlmxlsubctrU",
  authDomain:"recetario-a8d06.firebaseapp.com",
  projectId:"recetario-a8d06",
  storageBucket:"recetario-a8d06.firebasestorage.app",
  messagingSenderId:"979672181967",
  appId:"1:979672181967:web:86bbbb84c5698736981bba"
};
const FBU="https://www.gstatic.com/firebasejs/11.10.0/";
const S={recipes:[],state:{},favs:new Set(),user:null,profile:null,ready:false,slow:false,fail:false};
let F=null,unsubs=[];
const LS_EMAIL="recetario.email";
const lsGet=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
const lsSet=(k,v)=>{try{v==null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch(e){}};
const uid=()=>S.user&&S.user.uid;
const isMine=r=>!!r&&r.ownerId===uid();
const isFav=r=>!!r&&S.favs.has(r.id);
const myName=()=>(S.profile&&S.profile.name)||(S.user&&S.user.displayName)||"";
const queues={};
function serial(key,fn){const p=(queues[key]||Promise.resolve()).then(fn,fn);queues[key]=p.catch(()=>{});return p;}
function onWriteErr(e){
  const c=e&&e.code||"";
  if(/resource-exhausted/.test(c))toast("Se llenó el lugar gratis por hoy. Probá mañana.");
  else if(/permission-denied/.test(c))toast("No tenés permiso para cambiar esta receta.");
  else toast("No se pudo guardar. Probá de nuevo.");
}
const recRef=id=>F.fs.doc(F.db,"recipes",id);
const userRef=()=>F.fs.doc(F.db,"users",uid());
async function putRecipe(r){
  if(!r.ownerId){r.ownerId=uid();}
  if(isMine(r))r.ownerName=myName();
  r.updatedAt=Date.now();
  const i=S.recipes.findIndex(x=>x.id===r.id);
  if(i>=0)S.recipes[i]=r;else S.recipes.unshift(r);
  render();
  const data=clone(r);delete data.fav;
  try{await serial(r.id,()=>F.fs.setDoc(recRef(r.id),data));return true}catch(e){onWriteErr(e);return false}
}
async function delRecipe(id){
  S.recipes=S.recipes.filter(x=>x.id!==id);render();
  try{await serial(id,()=>F.fs.deleteDoc(recRef(id)))}catch(e){onWriteErr(e)}
}
async function saveUser(patch){
  try{await serial("_user",()=>F.fs.setDoc(userRef(),patch,{merge:true}))}catch(e){onWriteErr(e)}
}
async function setState(patch){
  S.state=Object.assign({},S.state,patch);
  for(const k in patch)if(patch[k]===null)delete S.state[k];
  await saveUser({state:clone(S.state)});
}
async function toggleFav(id){
  const on=!S.favs.has(id);
  on?S.favs.add(id):S.favs.delete(id);render();
  await saveUser({favs:on?F.fs.arrayUnion(id):F.fs.arrayRemove(id)});
  return on;
}
async function initStore(){
  try{
    const [app,au,fs]=await Promise.all([import(FBU+"firebase-app.js"),import(FBU+"firebase-auth.js"),import(FBU+"firebase-firestore.js")]);
    const a=app.initializeApp(FB_CFG);
    const auth=au.getAuth(a);auth.languageCode="es";
    let db;try{db=fs.initializeFirestore(a,{localCache:fs.persistentLocalCache()})}catch(e){db=fs.getFirestore(a)}
    F={auth,db,au,fs};
  }catch(e){S.fail=true;S.ready=true;render();return;}
  if(F.au.isSignInWithEmailLink(F.auth,location.href)){
    const email=lsGet(LS_EMAIL);
    if(email)await finishEmailLink(email);
    else S.linkPending=location.href;
  }
  F.au.getRedirectResult(F.auth).catch(e=>authErr(e));
  F.au.onAuthStateChanged(F.auth,onUser);
}
async function finishEmailLink(email){
  const href=S.linkPending||location.href;
  try{await F.au.signInWithEmailLink(F.auth,email,href);lsSet(LS_EMAIL,null);S.linkPending=null;history.replaceState(null,"",location.pathname);return true}
  catch(e){S.linkPending=null;history.replaceState(null,"",location.pathname);authErr(e);return false}
}
function authErr(e){
  const c=e&&e.code||"";
  if(/popup-closed|cancelled-popup|user-cancelled/.test(c))return;
  if(/invalid-action-code|expired-action-code/.test(c))toast("El link venció o ya se usó. Pedí uno nuevo.");
  else if(/invalid-email/.test(c))toast("Ese email no parece válido.");
  else if(/network/.test(c))toast("No hay conexión. Probá de nuevo.");
  else if(/too-many-requests|quota/.test(c))toast("Demasiados intentos. Esperá un rato.");
  else if(/unauthorized-domain|operation-not-allowed/.test(c))toast("Este acceso no está activado todavía.");
  else toast("No pudimos entrar. Probá de nuevo.");
}
function onUser(u){
  unsubs.forEach(f=>f());unsubs=[];
  S.user=u;S.recipes=[];S.profile=null;S.favs=new Set();S.state={};S.slow=false;
  if(!u){S.ready=true;stack=[{n:S.linkPending?"email":"welcome"}];if(S.linkPending)stack[0].confirm=true;scrollTo(0,0);render();return;}
  S.ready=false;render();
  let gotUser=false,gotRecs=false;
  const done=()=>{if(!(gotUser&&gotRecs)||S.ready)return;S.ready=true;
    stack=[{n:"home"}];if(!S.profile.name)stack=[{n:"name"}];scrollTo(0,0);render();};
  const timer=setTimeout(()=>{if(!S.ready){S.slow=true;gotUser=gotRecs=true;S.profile=S.profile||{};done();}},10000);
  unsubs.push(F.fs.onSnapshot(userRef(),snap=>{
    S.profile=snap.exists()?snap.data():{};
    S.favs=new Set(S.profile.favs||[]);S.state=S.profile.state||{};
    gotUser=true;done();if(S.ready)render();
  },()=>{S.profile=S.profile||{};gotUser=true;done();}));
  const q=F.fs.query(F.fs.collection(F.db,"recipes"),F.fs.orderBy("createdAt","desc"));
  unsubs.push(F.fs.onSnapshot(q,snap=>{
    S.recipes=snap.docs.map(d=>Object.assign({},d.data(),{id:d.id}));
    if(!snap.metadata.fromCache){S.slow=false;clearTimeout(timer);}
    gotRecs=true;done();if(S.ready)render();
  },()=>{clearTimeout(timer);S.slow=true;gotRecs=true;done();render();}));
}

/* ================= router ================= */
let stack=[{n:"loading"}];
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

