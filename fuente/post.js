
/* ================= more helpers ================= */
function parseTimeInput(s){
  s=norm(s);if(!s)return 0;
  const h=s.match(/(\d+(?:[.,]\d+)?)\s*(h|hs|hora|horas)\b/);
  const m=s.match(/(\d+)\s*(m|min|mins|minutos?)\b/);
  if(h){let t=Math.round(parseFloat(h[1].replace(",","."))*60);if(m)t+=+m[1];else{const after=s.slice(s.indexOf(h[0])+h[0].length).match(/(\d+)/);if(after)t+=+after[1];}return t;}
  if(m)return +m[1];
  const n=s.match(/(\d+)/);return n?+n[1]:0;
}
function fmtLong(m){m=+m||0;if(!m)return"";if(m<60)return m+" minutos";const h=Math.floor(m/60),r=m%60;return (h===1?"1 hora":h+" horas")+(r?" y "+r+" minutos":"");}
const two=n=>String(n).padStart(2,"0");
const cap1=s=>s?s.charAt(0).toUpperCase()+s.slice(1):s;
function ingText(text,f){const x=f===1?splitIng(text):scaleIng(text,f);return{q:x.q,name:cap1(x.name||text)};}
function needsList(r,stepText,f){
  const t=norm(stepText);const out=[];
  for(const ing of r.ingredients||[]){const k=ingKey(ing);if(!k)continue;const stem=k.length>4?k.slice(0,k.length-1):k;
    if(t.includes(stem)){const x=ingText(ing,f);const nm=x.name.split(/[,(]/)[0].trim();out.push(x.q?(/[a-z]$/i.test(x.q)?x.q+" de "+nm.toLowerCase():x.q+" "+nm.toLowerCase()):nm);}}
  return [...new Set(out)].slice(0,6);
}
function fmtDate(ts){try{return new Date(ts).toLocaleDateString("es-AR",{day:"numeric",month:"long"})}catch(e){return""}}

/* ================= toasts ================= */
let toastT=null,toastAct=null;
function toast(msg,actLabel,actFn,ms){
  const el=document.getElementById("toasts");
  toastAct=actFn||null;
  el.innerHTML=`<div class="toast"><span class="lbl">${esc(msg)}</span>${actLabel?`<button data-act="toastAct">${esc(actLabel)}</button>`:""}</div>`;
  clearTimeout(toastT);toastT=setTimeout(()=>{el.innerHTML="";toastAct=null},ms||(actLabel?5000:2400));
}

/* ================= sheets ================= */
let sheet=null;
// The dim also tints the page background, so the strip behind Safari's floating bottom bar
// turns gray with the rest of the screen instead of staying light.
function openSheet(s){sheet=s;renderSheet();requestAnimationFrame(()=>{if(!sheet)return;document.getElementById("layer").classList.add("open");document.documentElement.classList.add("dimmed");});}
function closeSheet(){sheet=null;document.getElementById("layer").classList.remove("open");document.documentElement.classList.remove("dimmed");}
const optRow=(icon,title,act,danger)=>`<button class="opt ${danger?"danger":""}" data-act="${act}"><span class="oi">${ic(icon,22)}</span><span class="ot bl-m">${esc(title)}</span><span class="ch">${ic("caret-right",18)}</span></button>`;
function renderSheet(){
  if(!sheet)return;
  const el=document.getElementById("sheet");let h=`<div class="grab"></div>`;
  const t=sheet.t;
  if(t==="add"){
    h+=`<h2 class="d-m pad" style="padding:4px 8px 0">Agregá una receta</h2><div class="col pad" style="padding:0 8px">${optRow("pencil-simple","Escribirla yo","addManual")}${optRow("file-csv","Desde un archivo CSV","addCsv")}</div>`;
  }else if(t==="menu"){
    const r=getR(sheet.id);
    h+=`<h2 class="t-m" style="padding:4px 8px 0">${esc(r?r.name:"")}</h2><div class="col" style="padding:0 8px">${isMine(r)?optRow("pencil-simple","Editar receta","edit"):""}${optRow("link","Compartir","share")}${isMine(r)?optRow("trash","Borrar receta","askDelete",true):""}</div>`;
  }else if(t==="photo"){
    h+=`<h2 class="t-m" style="padding:4px 8px 0">Foto</h2><div class="col" style="padding:0 8px">${optRow("camera","Cambiar foto","pickPhoto")}${optRow("trash","Quitar foto","rmPhoto",true)}</div>`;
  }else if(t==="delete"){
    const r=getR(sheet.id);
    h+=`<div class="col g8" style="padding:4px 8px 8px"><h2 class="t-m">¿Borrar “${esc(r?r.name:"")}”?</h2><p class="bm c2">La receta se borra de tu recetario y no se puede recuperar.</p></div><div class="col g8"><button class="btn danger wide" data-act="doDelete">Borrar receta</button><button class="btn txt wide" data-act="closeSheet">Cancelar</button></div>`;
  }else if(t==="dup"){
    h+=`<div class="col g8" style="padding:4px 8px 8px"><h2 class="t-m">Ya tenés esta receta</h2><p class="bm c2">“${esc(sheet.existingName)}” está guardada desde el ${esc(fmtDate(sheet.since))}.</p></div><div class="col g8"><button class="btn pri wide" data-act="openExisting">Abrir la que tengo</button><button class="btn txt wide" data-act="saveCopy">Guardar una copia</button></div>`;
  }else if(t==="exit"){
    h+=`<div class="col g8" style="padding:4px 8px 8px"><h2 class="t-m">¿Salir del modo cocina?</h2><p class="bm c2">Guardamos que ibas por el paso ${cook.step+1}, podés seguir cuando quieras.</p></div><div class="col g8"><button class="btn pri wide" data-act="closeSheet">Seguir cocinando</button><button class="btn txt wide" data-act="exitCook">Salir</button></div>`;
  }else if(t==="atajo"){
    h+=`<div class="col g8" style="padding:4px 8px 8px"><h2 class="t-m">Timer en el Reloj</h2><p class="bm c2">Así suena aunque cierres Safari o bloquees el teléfono. La primera vez hay que instalar el atajo «Timer Recetario»:</p>
    <ol class="bm c2" style="margin:4px 0 0;padding-left:20px;display:flex;flex-direction:column;gap:4px"><li>Tocá «Instalar atajo» y descargalo.</li><li>Abrilo desde Descargas y tocá «Agregar atajo».</li><li>Volvé acá y tocá «Ya lo instalé».</li></ol></div>
    <div class="col g8"><a class="btn pri wide" href="atajo/Timer%20Recetario.shortcut" download="Timer Recetario.shortcut">Instalar atajo</a><button class="btn sec wide" data-act="atajoListo" data-m="${sheet.m}">Ya lo instalé</button><button class="btn txt wide" data-act="closeSheet">Cancelar</button></div>`;
  }else if(t==="steps"){
    const r=getR(cook.id);
    h+=`<h2 class="t-m" style="padding:4px 8px 0">Pasos</h2><div class="col g8">${r.steps.map((s,i)=>`<button class="scard" data-act="jumpStep" data-i="${i}" style="${i===cook.step?"box-shadow:inset 0 0 0 1.5px var(--accent)":""}"><span class="bm-m n">${two(i+1)}</span><span class="bm">${esc(s)}</span></button>`).join("")}</div>`;
  }
  el.innerHTML=h;
}

/* ================= drafts ================= */
let draft=null;
function toDraft(r){
  const d=clone(r);
  d.time=r.time?fmtTime(r.time):"";
  d.ings=(r.ingredients||[]).map(s=>{const x=splitIng(s);return{q:x.q,n:x.q?x.name:s};});
  if(!d.ings.length)d.ings=[{q:"",n:""}];
  d.steps=(r.steps||[]).slice();if(!d.steps.length)d.steps=[""];
  delete d.ingredients;return d;
}
function blank(){return toDraft({id:newId(),name:"",time:0,servings:4,ingredients:[],steps:[],fav:false,createdAt:Date.now()});}
function fromDraft(d){
  const r=clone(d);
  r.name=(r.name||"").trim()||"Receta sin nombre";
  r.time=parseTimeInput(d.time);
  r.servings=Math.max(1,parseInt(r.servings)||1);
  r.ingredients=(d.ings||[]).map(x=>((x.q||"").trim()+" "+(x.n||"").trim()).trim()).filter(Boolean);
  r.steps=(d.steps||[]).map(s=>String(s).trim()).filter(Boolean);
  delete r.ings;if(!r.photo){delete r.photo;delete r.photoCutout;}delete r.drawing;
  return r;
}
function findDup(r){const n=norm(r.name);return S.recipes.find(x=>x.id!==r.id&&isMine(x)&&norm(x.name)===n);}

/* ================= pieces ================= */
const V={};
const ibtn=(act,icon,label,cls="")=>`<button class="ib ${cls}" data-act="${act}" aria-label="${label}">${ic(icon,20)}</button>`;
const spacer=`<span style="width:44px;flex:none"></span>`;
const nav=(l,m,r)=>`<div class="nav r16">${l||spacer}<div class="mid">${m||""}</div>${r||spacer}</div>`;
const stepper=(act,v)=>`<div class="stepper"><button data-act="${act}" data-d="-1" aria-label="Menos">${ic("minus",18)}</button><span class="bl-m" data-sv>${v}</span><button data-act="${act}" data-d="1" aria-label="Más">${ic("plus",18)}</button></div>`;
const arrowR="";

V.loading=()=>`<div class="screen"><div class="center"><div class="spin"></div></div></div>`;

/* ----- home ----- */
const firstName=n=>String(n||"").trim().split(/\s+/)[0]||"";
const cardHtml=(r,other)=>{const t=r.time?fmtTime(r.time):(r.steps||[]).length+" pasos";const sub=other&&r.ownerName?firstName(r.ownerName)+" · "+t:t;
  return`<button class="rc" data-act="open" data-id="${r.id}"><div class="tile">${pic(r)}</div><div class="tx"><span class="bm-m nm">${esc(r.name)}</span><span class="cap c2">${esc(sub)}</span></div>${isFav(r)&&fullPhoto(r)?`<span class="fav">${ic("heart-fill",18)}</span>`:isFav(r)?`<span class="fav" style="color:var(--accent-ink);filter:none">${ic("heart-fill",18)}</span>`:""}</button>`;};
const addCard=`<button class="rc addc" data-act="openAdd"><img src="img/mas.png" width="60" height="60" alt="" draggable="false"><span class="bm-m">Subí tu primera receta</span></button>`;
const fakeCard=(n,t,k,cls)=>`<div class="rc ${cls}" aria-hidden="true"><div class="tile">${ill(k)}</div><div class="tx"><span class="bm-m nm">${n}</span><span class="cap c2">${t}</span></div></div>`;
const deck=`<div class="deck" aria-hidden="true">${fakeCard("Tarta de limón","45 min","tarta","dk l")}${fakeCard("Sopa de tomate","30 min","sopa","dk r")}<div class="dfront"><div class="tile"><span class="dic">${ic("pencil-simple",24)}</span></div><div class="tx"><span class="bm-m">Tu primera receta</span><span class="cap" style="color:var(--ph)">¿Cuánto tarda?</span></div></div></div>`;
V.home=(p)=>{
  const q=p.q||"",searching=p.searching;
  const byNew=(a,b)=>(b.createdAt||0)-(a.createdAt||0);
  const own=S.recipes.filter(isMine);
  const mine=S.recipes.filter(r=>isMine(r)||isFav(r)).sort(byNew);
  const others=S.recipes.filter(r=>!isMine(r)).sort(byNew);
  const tab=p.tab||(mine.length?"mis":"explorar");p.tab=tab;
  let list=tab==="mis"?mine:others;
  if(q){const nq=norm(q);list=list.filter(r=>norm(r.name).includes(nq)||(r.ingredients||[]).some(i=>norm(i).includes(nq)));}
  const prog=S.state.progress&&getR(S.state.progress.id)?S.state.progress:null;
  const title=tab==="mis"?"Mis recetas":"Explorar";
  const base=tab==="mis"?mine:others;
  let h=`<div class="screen">`;
  h+=searching?`<div class="nav" style="padding-left:var(--gx)"><label class="search">${ic("magnifying-glass",20)}<input id="q" data-bind="q" class="bm" placeholder="Buscar en ${title.toLowerCase()}" value="${esc(q)}" autocomplete="off" enterkeyhint="search"></label><button class="btn txt sm" data-act="endSearch">Cancelar</button></div>`
    :`<div class="nav" style="padding-left:var(--gx);padding-right:var(--gxr)"><h1 class="d-m">${title}</h1><div class="row">${base.length?ibtn("search","magnifying-glass","Buscar"):""}<button class="ib avatar" data-act="profile" aria-label="Perfil"><span class="bl-m">${esc(initial())}</span></button></div></div>`;
  h+=`<div class="body" style="gap:16px;padding-bottom:120px">`;
  if(S.slow)h+=`<div class="notice danger">${ic("warning-circle",18)}<span>No pudimos conectarnos todavía. Seguimos intentando.</span></div>`;
  if(tab==="mis"&&prog&&!searching){const r=getR(prog.id),tot=(r.steps||[]).length||1,st=Math.min(prog.step+1,tot);
    h+=`<div class="resume2"><button class="rtap" data-act="resumeCook"><span class="rtile">${pic(r)}</span><span class="rtx"><span class="lbl ca">Seguí cocinando</span><b class="bm-m">${esc(r.name)}</b><span class="rbar" aria-hidden="true"><i style="width:${Math.round(st/tot*100)}%"></i></span><span class="cap c2">Paso ${st} de ${tot}</span></span></button><button class="rx" data-act="dismissResume" aria-label="Quitar de inicio">${ic("x",16)}</button></div>`;}
  if(tab==="mis"&&!mine.length){
    h+=`<div class="col" style="align-items:center;padding-top:4px">${deck}<div class="col g8" style="text-align:center;align-items:center"><h2 class="t-m">Empezá tu recetario</h2><p class="bm c2" style="max-width:280px">Guardá las recetas de tu casa y cocinalas paso a paso.</p></div></div>
    <div class="col g4" style="padding-top:4px"><button class="btn pri wide" data-act="addManual">Escribir una receta</button><button class="btn txt wide" data-act="addCsv">Importar desde un CSV</button></div>`;
  }else if(q&&!list.length)h+=`<div class="col g8" style="padding-top:40px;text-align:center"><h2 class="t-m">No encontramos nada</h2><p class="bm c2">Probá con otra palabra.</p></div>`;
  else{
    const showAdd=tab==="explorar"&&!own.length&&!q;
    h+=`<div class="grid">${showAdd?addCard:""}${list.map(r=>cardHtml(r,tab==="explorar")).join("")}</div>`;
    if(tab==="explorar"&&!others.length&&!q)h+=`<p class="bm c2" style="text-align:center;padding-top:8px">Todavía nadie más subió recetas.</p>`;
  }
  h+=`</div></div>`;
  if(!searching)h+=`<nav class="tabbar" aria-label="Secciones"><button class="tb ${tab==="mis"?"on":""}" data-act="tab" data-t="mis" aria-label="Mis recetas">${ic("hamburger-fill",22)}<span class="lbl">Mis recetas</span></button><button class="tb ${tab==="explorar"?"on":""}" data-act="tab" data-t="explorar" aria-label="Explorar">${ic("compass-fill",22)}<span class="lbl">Explorar</span></button></nav><button class="fab" data-act="openAdd" aria-label="Agregar receta">${ic("plus",26)}</button>`;
  return h;
};

/* ----- detail ----- */
V.detail=(p)=>{
  const r=getR(p.id);if(!r)return V.gone();
  const base=r.servings||1,sv=p.sv||base,f=sv/base;
  let h=`<div class="cbar" id="cbar">${nav(ibtn("back","caret-left","Volver"),`<span class="bm-m cbt">${esc(r.name)}</span>`,"")}</div><div class="screen" style="padding-top:0"><div class="hero" id="hero">${fullPhoto(r)?`<div class="ph">${pic(r)}</div>`:`<div class="art">${pic(r)}</div>`}
  ${nav(ibtn("back","caret-left","Volver",fullPhoto(r)?"":"dark"),"",`<div class="row">${ibtn("fav",isFav(r)?"heart-fill":"heart","Favorita",fullPhoto(r)?"":"dark")}${ibtn("menu","dots-three","Más",fullPhoto(r)?"":"dark")}</div>`)}</div>
  <div class="sheetc">
    <div class="titleRow"><div class="col g8"><h1 class="d-m">${esc(r.name)}</h1>${!isMine(r)&&r.ownerName?`<span class="lbl c2">De ${esc(r.ownerName)}</span>`:""}</div>${r.time?`<div class="tm"><span class="d-m ca">${esc(fmtTime(r.time))}</span><span class="lbl c2">Tiempo</span></div>`:""}</div>`;
  if(r.ingredients.length){
    h+=`<div class="col g8"><div class="between"><h2 class="hl">Ingredientes</h2>${stepper("sv",sv)}</div><div class="rows">${r.ingredients.map(i=>{const x=ingText(i,f);return`<div class="r"><span class="bm">${esc(x.name)}</span>${x.q?`<span class="bm-m ca">${esc(x.q)}</span>`:""}</div>`}).join("")}</div>${sv!==base?`<p class="cap ca">Cantidades para ${sv} porciones</p>`:""}</div>`;
  }
  if(r.steps.length){
    h+=`<div class="col g16"><div class="between" style="align-items:baseline"><h2 class="t-m">Pasos</h2><span class="lbl c2">${r.steps.length} ${r.steps.length===1?"paso":"pasos"}${r.time?" · "+esc(fmtTime(r.time)):""}</span></div><div class="col g8">${r.steps.map((s,i)=>`<div class="scard"><span class="bm-m n">${two(i+1)}</span><span class="bm">${esc(s)}</span></div>`).join("")}</div></div>`;
  }
  h+=`</div>${r.steps.length?`<div class="foot"><button class="btn pri wide" data-act="cook">Empezar a cocinar${arrowR}</button></div>`:""}</div>`;
  return h;
};
V.gone=()=>`<div class="screen">${nav(ibtn("home","caret-left","Volver"))}<div class="center"><h2 class="t-m">Esta receta ya no está</h2><button class="btn pri" data-act="home">Ir a mis recetas</button></div></div>`;

/* ----- forms ----- */
function photoTile(d){
  if(d.photo)return`<button class="photoTile has" data-act="photoMenu" aria-label="Foto"><img class="${d.photoCutout?"ill":"photo"}" src="${esc(d.photo)}" alt=""></button>`;
  return`<button class="photoTile" data-act="pickPhoto">${ic("image",20)}<span class="lbl">Agregá una foto</span></button>`;
}
const fTime=d=>`<div class="field"><label class="lbl c2" for="f-time">Tiempo</label><input class="input" id="f-time" data-bind="time" value="${esc(d.time)}" placeholder="ej. 45 min" autocomplete="off"></div>`;
const fServ=d=>`<div class="between"><span class="lbl c2">Porciones</span>${stepper("dsv",d.servings)}</div>`;
const fName=(d,auto)=>`<input class="bare d-m" id="f-name" data-bind="name" value="${esc(d.name)}" placeholder="Nombre" autocomplete="off" ${auto?"autofocus":""}>`;
function fIngs(d){
  return`<div class="col g8">${d.ings.map((x,i)=>`<div class="ecard"><input class="bare bm-m q" data-bind="iq.${i}" value="${esc(x.q)}" placeholder="800 g" autocomplete="off"><input class="bare bm" data-bind="in.${i}" value="${esc(x.n)}" placeholder="Ingrediente" autocomplete="off"><button class="x" data-act="rmIng" data-i="${i}" aria-label="Quitar">${ic("x",16)}</button></div>`).join("")}</div>
  <button class="addrow bm-m" data-act="addIng">Agregar ingrediente</button>`;
}
function fSteps(d){
  return`<div class="col g8">${d.steps.map((s,i)=>`<div class="scard"><span class="bm-m n" style="padding-top:1px">${two(i+1)}</span><textarea class="bare bm" rows="1" data-bind="st.${i}" placeholder="${i===0?"Ej: Rehogá la cebolla en aceite de oliva.":"¿Qué sigue?"}">${esc(s)}</textarea></div>`).join("")}</div>
  <button class="addrow bm-m" data-act="addStep">Agregar paso</button>`;
}
V.manual=(p)=>{
  const s=p.s||1,d=draft;
  let h=`<div class="screen">${nav(ibtn(s===1?"cancelDraft":"wprev","caret-left","Volver"),`<span class="lbl c2">${s} de 3</span>`,"")}<div class="body"><div class="prog">${[1,2,3].map(i=>`<i class="${i<=s?"on":""}"></i>`).join("")}</div>`;
  if(s===1)h+=fName(d,!d.name)+photoTile(d)+fTime(d)+fServ(d);
  if(s===2)h+=`<h1 class="d-m">¿Qué lleva?</h1><div class="col g8">${fIngs(d)}</div>`;
  if(s===3)h+=`<h1 class="d-m">¿Cómo se hace?</h1><div class="col g8">${fSteps(d)}</div>`;
  h+=`</div><div class="foot">${s===1?`<button class="btn pri wide" data-act="wnext">Siguiente: ingredientes${arrowR}</button>`:s===2?`<button class="btn pri wide" data-act="wnext">Siguiente: pasos${arrowR}</button>`:`<button class="btn pri wide" data-act="saveDraft">Guardar receta</button>`}</div></div>`;
  return h;
};
V.edit=()=>{
  const d=draft;
  return`<div class="screen">${nav(ibtn("back","x","Cerrar"),"",`<button class="btn pri sm" data-act="saveEdit">Guardar</button>`)}<div class="body">${fName(d)}${photoTile(d)}${fTime(d)}${fServ(d)}
  <div class="col g12"><h2 class="hl">Ingredientes</h2><div class="col g8">${fIngs(d)}</div></div>
  <div class="col g12"><h2 class="hl">Pasos</h2><div class="col g8">${fSteps(d)}</div></div></div></div>`;
};

/* ----- csv ----- */
const FIELDS=[["name","nombre"],["time","tiempo"],["servings","porciones"],["ingredients","ingredientes"],["steps","pasos"],["skip","omitir"]];
let csv=null;
V.csv=()=>`<div class="screen">${nav(ibtn("home","caret-left","Volver"))}<div class="body">
  <h1 class="d-m">Importar un CSV</h1>
  <button class="drop" data-act="chooseCsv"><span class="oi">${ic("upload-simple",22)}</span><span class="bl-m">Elegí un archivo CSV</span><span class="cap c2">Desde Archivos, iCloud o Drive</span></button>
  ${csv&&csv.err?`<div class="notice danger">${ic("warning-circle",18)}<span>${esc(csv.err)}</span></div>`:""}
  <div class="col g12"><span class="lbl c2">Columnas que buscamos</span><div class="chips">${["nombre","tiempo","porciones","ingredientes","pasos"].map(c=>`<span class="chip">${c}</span>`).join("")}</div></div>
  <button class="addrow bm-m" data-act="template">Descargar plantilla</button>
  </div><div class="foot"><button class="btn pri wide" data-act="chooseCsv">Elegir archivo</button></div></div>`;
V.csvmap=()=>{
  const m=csv.map;const ok=m.includes("name");
  return`<div class="screen">${nav(ibtn("back","caret-left","Volver"))}<div class="body">
  <h1 class="d-m">Columnas</h1>
  <div class="filecard"><span class="oi">${ic("file-csv",20)}</span><div class="col g4" style="flex:1;min-width:0"><span class="bm-m" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(csv.file)}</span><span class="cap c2">${csv.rows.length} ${csv.rows.length===1?"receta":"recetas"} · ${csv.headers.length} columnas</span></div><button class="lbl ca" data-act="chooseCsv">Cambiar</button></div>
  <div class="col g8"><span class="lbl c2 row" style="gap:6px">Tu columna ${ic("arrow-right",14)} campo de receta</span>
  <div class="col">${csv.headers.map((hd,i)=>{const f=FIELDS.find(x=>x[0]===m[i]);const on=m[i]!=="skip";return`<div class="colmap"><span class="cn bm ${on?"":"cm"}">${esc(hd||"Columna "+(i+1))}</span><span class="arr">${ic("arrow-right",16)}</span><label class="chip ${on?"on":""}">${on?ic("check",14):""}${f[1]}<select data-bind="map.${i}" aria-label="Campo para ${esc(hd)}">${FIELDS.map(([k,l])=>`<option value="${k}" ${m[i]===k?"selected":""}>${l}</option>`).join("")}</select></label></div>`}).join("")}</div></div>
  ${ok?"":`<div class="notice danger">${ic("warning-circle",18)}<span>Elegí qué columna es el nombre.</span></div>`}
  </div><div class="foot"><button class="btn pri wide" data-act="csvRows" ${ok?"":"disabled"}>Siguiente: elegir recetas${arrowR}</button></div></div>`;
};
V.csvpick=()=>{
  const items=csv.items,n=items.filter(x=>x.on).length,dups=items.filter(x=>x.dup),all=n===items.length;
  return`<div class="screen">${nav(ibtn("back","caret-left","Volver"))}<div class="body" style="gap:16px">
  <h1 class="d-m">${items.length} ${items.length===1?"receta":"recetas"}</h1>
  <div class="between"><span class="lbl c2">${n} ${n===1?"elegida":"elegidas"}</span><button class="lbl ca" data-act="csvAll">${all?"Sacar todas":"Elegir todas"}</button></div>
  <div class="col">${items.map((x,i)=>`<button class="pick" data-act="csvToggle" data-i="${i}"><span class="rcheck ${x.on?"on":""}">${x.on?ic("check",13):""}</span><span class="tx bm ${x.on?"":"cm"}">${esc(x.r.name)}</span><span class="bm-m c2">${esc(fmtTime(x.r.time))}</span></button>`).join("")}</div>
  ${dups.length?`<div class="notice danger">${ic("warning-circle",18)}<span>${dups.length===1?esc(dups[0].r.name)+" ya está en tus recetas":dups.length+" recetas ya están en tus recetas"}</span></div>`:""}
  </div><div class="foot"><button class="btn pri wide" data-act="csvImport" ${n?"":"disabled"}>Importar ${n} ${n===1?"receta":"recetas"}</button></div></div>`;
};
V.csvdone=(p)=>`<div class="screen">${nav()}<div class="center" style="gap:24px">${badge("azul")}
  <div class="col g12"><h1 class="d-m">${p.count} ${p.count===1?"receta nueva":"recetas nuevas"}</h1><p class="bm c2">${p.skipped?esc(p.skipped)+" se salteó porque ya la tenés. ":""}Las nuevas están primero en tus recetas.</p></div></div>
  <div class="foot"><button class="btn pri wide" data-act="home">Ver mis recetas</button><button class="btn txt wide" data-act="addCsv">Importar otro archivo</button></div></div>`;

const badge=k=>`<img class="badge" src="img/check-${k}.png" width="180" height="180" alt="" draggable="false">`;
/* ----- cooking ----- */
let cook=null;
let wake=null;
async function lockOn(){try{if("wakeLock" in navigator&&!wake){wake=await navigator.wakeLock.request("screen");wake.addEventListener("release",()=>{wake=null});}}catch(e){}}
function lockOff(){try{wake&&wake.release()}catch(e){}wake=null;}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible"&&cook){lockOn();if(cook.timer)onTick();}});

V.prep=()=>{
  const r=getR(cook.id);if(!r)return V.gone();
  const f=cook.sv/(r.servings||1);
  return`<div class="screen">${nav(ibtn("leaveCookPrep","x","Cerrar"))}<div class="body">
  <div class="col g8"><h1 class="d-m">Antes de empezar</h1><p class="bm c2">Son ${r.steps.length} ${r.steps.length===1?"paso":"pasos"}${r.time?" y unas "+fmtLong(r.time):""}.</p></div>
  ${r.ingredients.length?`<div class="col">${r.ingredients.map((i,k)=>{const x=ingText(i,f);const on=cook.checked.has(k);return`<button class="pick" data-act="tick" data-i="${k}"><span class="rcheck ${on?"on":""}">${on?ic("check",13):""}</span><span class="tx bm ${on?"":"cm"}">${esc(x.name)}</span><span class="bm-m c2">${esc(x.q)}</span></button>`}).join("")}</div>`:""}
  </div><div class="foot"><button class="btn pri wide" data-act="startCook">Empezar${arrowR}</button></div></div>`;
};
V.step=()=>{
  const r=getR(cook.id);if(!r)return V.gone();
  const i=cook.step,n=r.steps.length,t=r.steps[i];
  const mins=stepMinutes(t),needs=needsList(r,t,cook.sv/(r.servings||1)),tm=cook.timer;
  let h=`<div class="screen">${nav(ibtn("askExit","x","Salir"),`<span class="lbl c2">Paso ${i+1} de ${n}</span>`,ibtn("stepsSheet","list-bullets","Ver pasos"))}<div class="body">
  <div class="prog">${r.steps.map((_,k)=>`<i class="${k<=i?"on":""}"></i>`).join("")}</div>
  <div class="col g24"><div class="d-xl">${two(i+1)}</div><p class="t-m">${esc(t)}</p></div>`;
  if(needs.length)h+=`<div class="col g12"><span class="lbl c2">Necesitás</span><div class="chips">${needs.map(x=>`<span class="chip soft">${esc(x)}</span>`).join("")}</div></div>`;
  if(tm&&tm.stepIdx===i)h+=`<button class="timerbox" data-act="showTimer"><span class="c2">${ic("timer",22)}</span><span class="tx col g4"><span class="bl-m" id="tmini">${fmtClock(timerLeft())}</span><span class="cap c2">${tm.running?"Timer corriendo":"Timer en pausa"}</span></span><span class="cm" style="padding-right:8px">${ic("caret-right",18)}</span></button>`;
  else if(mins)h+=`<div class="timerbox"><span class="c2">${ic("timer",22)}</span><span class="tx col g4"><span class="bl-m">${mins} min</span><span class="cap c2">Timer de este paso</span></span><button class="btn pri sm" data-act="startTimer" data-m="${mins}">Iniciar</button></div>`+(IOS?`<button class="addrow bm-m" style="margin-top:-12px" data-act="clockTimer" data-m="${mins}">Ponerlo en el Reloj del iPhone</button>`:"");
  h+=`</div><div class="foot row"><button class="btn txt" data-act="prevStep" ${i===0?"disabled":""}>Atrás</button>${i<n-1?`<button class="btn pri" data-act="nextStep">Siguiente paso${arrowR}</button>`:`<button class="btn pri" data-act="finish" style="min-width:150px">Terminar</button>`}</div></div>`;
  return h;
};
function timerLeft(){const t=cook&&cook.timer;if(!t)return 0;return t.running?Math.max(0,Math.round((t.endAt-Date.now())/1000)):t.left;}
const fmtClock=s=>{s=Math.max(0,s);const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return h?h+":"+two(m)+":"+two(x):m+":"+two(x);};
const fmtTotal=s=>{const m=Math.round(s/60);return m>=60?Math.floor(m/60)+":"+two(m%60)+" h":m+" min";};
V.timer=()=>{
  const t=cook.timer,r=getR(cook.id),left=timerLeft(),txt=fmtClock(left);
  return`<div class="screen green">${nav(ibtn("hideTimer","caret-left","Volver","dark"))}<div class="body">
  <div class="prog light">${r.steps.map((_,k)=>`<i class="${k<=t.stepIdx?"on":""}"></i>`).join("")}</div>
  <h1 class="t-m">Paso ${t.stepIdx+1}</h1>
  <div class="col g8"><div class="countrow" id="tbig"><span class="count" id="tnum">${txt}</span></div><div class="d-mr" style="color:var(--on-accent-2)">de ${fmtTotal(t.total)}</div></div>
  <p class="bm" style="color:var(--on-accent-2)">${esc(r.steps[t.stepIdx])}</p>
  <p class="cap" style="color:var(--on-accent-2);opacity:.75">Dejá esta pantalla abierta: va a sonar cuando termine, aunque el teléfono esté en silencio.</p>${IOS?`<button class="addrow bm-m" style="color:#fff" data-act="clockTimer" data-m="${Math.max(1,Math.ceil(left/60))}">Mejor, ponerlo en el Reloj del iPhone</button>`:""}
  </div><div class="foot row" style="gap:8px"><button class="btn lightglass" style="flex:1" data-act="toggleTimer">${t.running?"Pausa":"Seguir"}</button><button class="btn darkglass" style="flex:1" data-act="plus5">+5 min</button></div></div>`;
};
V.timerdone=()=>{
  const r=getR(cook.id),i=cook.timerDoneStep,last=i>=r.steps.length-1;
  return`<div class="screen green">${nav()}<div class="center" style="gap:24px">${badge("blanco")}
  <div class="col g12"><h1 class="d-m">¡Listo el timer!</h1><p class="bm" style="color:var(--on-accent-2)">Terminó el tiempo del paso ${i+1}.${last?"":" Seguimos con el paso "+(i+2)+"."}</p></div></div>
  <div class="foot"><button class="btn lightglass wide" data-act="${last?"ackTimer":"ackNext"}">${last?"Volver al paso":"Siguiente paso"+arrowR}</button><button class="btn darkglass wide" data-act="plus5done">+5 min</button></div></div>`;
};
V.done=()=>{
  const r=getR(cook.id);
  return`<div class="screen">${nav()}<div class="body">
  <div class="center" style="gap:32px">${fullPhoto(r)?`<div class="bigcircle" style="overflow:hidden">${pic(r)}</div>`:`<div style="width:220px;height:165px">${pic(r)}</div>`}<h1 class="t-m">Buen provecho :)</h1></div>
  </div><div class="foot"><button class="btn pri wide" data-act="doneBack">Volver a la receta</button></div></div>`;
};

/* ----- cuenta ----- */
const initial=()=>(myName()||(S.user&&S.user.email)||"?").trim().charAt(0).toUpperCase();
const okEmail=v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||"").trim());
const WALL=[
  {pad:30,items:[["Ñoquis de papa","1 h","pasta"],["Flan casero","50 min","tarta"],["Ragú blanco","3 h","pasta"],["Calabaza","40 min","sopa"],["Fideos","15 min","pasta"]]},
  {pad:0,items:[["Fideos","15 min","pasta"],["Tarta de limón","45 min","tarta"],["Ragú de carne","2 h","pasta"],["Sopa de tomate","30 min","sopa"],["Flan casero","50 min","tarta"]]},
  {pad:64,items:[["Sopa de tomate","30 min","sopa"],["Ñoquis","1 h","pasta"],["Flan","50 min","tarta"],["Ragú","2 h","pasta"],["Tarta","45 min","tarta"]]},
  {pad:20,items:[["Ragú blanco","3 h","pasta"],["Sopa","30 min","sopa"],["Tarta de limón","45 min","tarta"],["Ñoquis","1 h","pasta"],["Flan","50 min","tarta"]]}
];
V.welcome=()=>`<div class="screen welcome">
  <div class="wcover" aria-hidden="true"><div class="wall">${WALL.map(r=>`<div class="wrow" style="padding-left:${(r.pad/.82).toFixed(1)}px">${r.items.map(([n,t,k])=>`<div class="rc"><div class="tile">${ill(k)}</div><div class="tx"><span class="bm-m nm">${n}</span><span class="cap c2">${t}</span></div></div>`).join("")}</div>`).join("")}</div><span class="ib wfav">${ic("heart-fill",20)}</span></div>
  <div class="wsheet"><h1 class="d-m">Recetas en casa</h1><p class="bm c2">Para guardar las recetas que cocinamos de forma personalizada :)</p>
  <div class="col g8" style="padding-top:16px"><button class="btn pri wide" data-act="google">Seguir con Google</button><button class="btn sec wide" data-act="toEmail">Entrar con email</button></div></div></div>`;
V.email=(p)=>{
  const v=p.email!=null?p.email:(lsGet(LS_EMAIL)||"");
  return`<div class="screen">${nav(p.confirm?"":ibtn("back","caret-left","Volver"))}<div class="body">
  <div class="col g8"><h1 class="d-m">${p.confirm?"Confirmá tu email":"¿Cuál es tu email?"}</h1><p class="bm c2">${p.confirm?"Abriste el link en otro navegador. Escribí el mismo email para entrar.":"Te mandamos un link para entrar. No hace falta contraseña."}</p></div>
  <div class="field"><label class="lbl c2" for="f-email">Email</label><input class="input" id="f-email" type="email" inputmode="email" autocomplete="email" autocapitalize="off" data-bind="email" value="${esc(v)}" placeholder="vos@email.com" autofocus></div>
  </div><div class="foot"><button class="btn pri wide" data-act="${p.confirm?"confirmEmail":"sendLink"}" ${p.busy?"disabled":""}>${p.confirm?"Entrar":"Mandame el link"}</button>${p.confirm?`<button class="btn txt wide" data-act="cancelLink">Usar otra cuenta</button>`:""}</div></div>`;
};
V.sent=(p)=>`<div class="screen">${nav()}<div class="center" style="gap:24px">${badge("azul")}
  <div class="col g8"><h1 class="d-m">Revisá tu mail</h1><p class="bm c2">Te mandamos un link a ${esc(p.email)}. Abrilo desde este teléfono.</p></div></div>
  <div class="foot"><button class="btn txt wide" data-act="resend">Mandarlo de nuevo</button></div></div>`;
V.name=(p)=>{
  const v=p.nm!=null?p.nm:(myName()||"");
  return`<div class="screen">${nav()}<div class="body">
  <div class="col g8"><h1 class="d-m">¿Cómo te llamás?</h1><p class="bm c2">Así aparece en las recetas que subís.</p></div>
  <div class="field"><label class="lbl c2" for="f-nm">Nombre</label><input class="input" id="f-nm" data-bind="nm" value="${esc(v)}" placeholder="Tu nombre" autocomplete="given-name" autofocus></div>
  </div><div class="foot"><button class="btn pri wide" data-act="saveName">Empezar</button></div></div>`;
};
V.profile=(p)=>{
  const v=p.pname!=null?p.pname:myName();
  return`<div class="screen">${nav(ibtn("back","caret-left","Volver"),`<span class="lbl c2">Perfil</span>`,"")}<div class="body">
  <div class="col g16"><div class="avatar big"><span>${esc(initial())}</span></div><div class="col g4"><h1 class="d-m">${esc(myName()||"Sin nombre")}</h1><p class="bm c2">${esc(S.user&&S.user.email||"")}</p></div></div>
  <div class="field"><label class="lbl c2" for="f-pname">Nombre</label><input class="input" id="f-pname" data-bind="pname" value="${esc(v)}" placeholder="Tu nombre" autocomplete="given-name" enterkeyhint="done"></div>
  </div><div class="foot"><button class="btn sec wide" data-act="logout">Cerrar sesión</button></div></div>`;
};
V.offline=()=>`<div class="screen"><div class="center"><h2 class="t-m">No pudimos cargar la app</h2><p class="bm c2">Revisá tu conexión y volvé a abrirla.</p><button class="btn pri" data-act="reload">Reintentar</button></div></div>`;

/* ================= render ================= */
const app=document.getElementById("app");
let lastKey="";
let fitKey="";
function fitCount(force){
  const row=document.getElementById("tbig");if(!row||!cook||!cook.timer)return;
  const num=document.getElementById("tnum"),t=cook.timer;
  // size from the widest text this timer can show, so it never changes while counting down
  const worst=t.total>=36000?"88:88:88":t.total>=3600?"8:88:88":t.total>=600?"88:88":"8:88";
  const max=row.parentNode.clientWidth,key=worst+max;
  if(!force&&key===fitKey)return;fitKey=key;
  const real=num.textContent;num.textContent=worst;num.style.fontSize="150px";
  const w=row.scrollWidth;num.textContent=real;
  num.style.fontSize=(w>max?Math.floor(150*max/w*0.97):150)+"px";
}
window.addEventListener("resize",()=>fitCount(true));
// The page background is what Safari shows around the page (above, and behind its floating
// bottom bar). It matches the screen: blue on the full-blue timer screens, the app's gray elsewhere.
function tint(){
  const c=cur(),blue=S.ready&&!S.fail&&(c.n==="timer"||c.n==="timerdone");
  document.documentElement.classList.toggle("blue-page",blue);
  const m=document.querySelector('meta[name="theme-color"]');
  if(m){const col=blue?"#3A5171":getComputedStyle(document.body).backgroundColor;if(m.getAttribute("content")!==col)m.setAttribute("content",col);}
}
function onScrollBar(){const b=document.getElementById("cbar"),h=document.getElementById("hero");if(!b||!h)return;b.classList.toggle("on",scrollY>h.offsetHeight-80);tint();}
window.addEventListener("scroll",onScrollBar,{passive:true});
function grow(el){el.style.height="auto";el.style.height=el.scrollHeight+"px";}
function render(){
  if(S.fail){app.innerHTML=V.offline();return;}
  if(!S.ready){app.innerHTML=V.loading();return;}
  const c=cur();
  if(c.n==="home"&&c.searching&&document.activeElement&&document.activeElement.id==="q"){updateHomeList();return;}
  // fade in only when moving to another screen; redraws of the same screen (portions, favorites,
  // data arriving) swap instantly so nothing blinks
  app.innerHTML=(V[c.n]||V.home)(c);
  const key=c.n+(c.s||"")+"|"+(c.id||"")+"|"+(c.tab||"");
  const entering=key!==lastKey;
  if(entering)app.querySelectorAll(".screen").forEach(el=>el.classList.add("enter"));
  app.querySelectorAll("textarea.bare").forEach(grow);
  fitCount(true);onScrollBar();tint();
  if(c.n==="detail")fixOldPhoto(getR(c.id));
  if(entering){lastKey=key;const a=app.querySelector("[autofocus]");a&&a.focus();}
  if(sheet)renderSheet();
}
function updateHomeList(){const c=cur();const tmp=document.createElement("div");tmp.innerHTML=V.home(c);const nb=tmp.querySelector(".body"),ob=app.querySelector(".body");if(nb&&ob)ob.replaceWith(nb);}
function keepScroll(fn){const y=scrollY;fn();render();scrollTo(0,y);}

/* ================= actions ================= */
const A={};
A.back=back;A.home=()=>{closeSheet();reset();};
A.toastAct=()=>{const f=toastAct;document.getElementById("toasts").innerHTML="";toastAct=null;f&&f();};
A.closeSheet=closeSheet;
A.openAdd=()=>openSheet({t:"add"});
A.dismissResume=()=>{const p=S.state.progress;if(!p)return;keepScroll(()=>{setState({progress:null});});toast("Listo, lo sacamos","Deshacer",()=>setState({progress:p}).then(()=>render()));};
const LS_ATAJO="recetario.atajo";
function runClock(m){location.href="shortcuts://run-shortcut?name="+encodeURIComponent("Timer Recetario")+"&input=text&text="+encodeURIComponent(String(m));}
A.clockTimer=(el)=>{const m=+el.dataset.m||1;if(lsGet(LS_ATAJO)){runClock(m);toast("Timer de "+m+" min en el Reloj");}else openSheet({t:"atajo",m});};
A.atajoListo=(el)=>{lsSet(LS_ATAJO,"1");closeSheet();runClock(+el.dataset.m||1);};
A.tab=(el)=>{const c=cur();if(c.tab===el.dataset.t)return;c.tab=el.dataset.t;c.q="";scrollTo(0,0);render();};
A.search=()=>{cur().searching=true;cur().q="";render();setTimeout(()=>{const q=document.getElementById("q");q&&q.focus()},30);};
A.endSearch=()=>{cur().searching=false;cur().q="";render();};
A.open=(el)=>{closeSheet();go("detail",{id:el.dataset.id});};
A.sv=(el)=>{const c=cur();const r=getR(c.id);c.sv=Math.max(1,Math.min(99,(c.sv||r.servings)+ +el.dataset.d));keepScroll(()=>{});};
A.fav=async()=>{const on=await toggleFav(cur().id);toast(on?"Guardada en favoritas":"Sacada de favoritas");};
A.menu=()=>openSheet({t:"menu",id:cur().id});
A.edit=()=>{closeSheet();if(!isMine(getR(cur().id)))return;draft=toDraft(getR(cur().id));go("edit");};
A.saveEdit=async()=>{if(!draft.name.trim()){const i=document.getElementById("f-name");i&&i.focus();return;}const r=fromDraft(draft);if(await putRecipe(r)){draft=null;back();toast("Cambios guardados");}};
A.share=async()=>{
  closeSheet();const r=getR(cur().id);
  const txt=`${r.name}\n${r.time?fmtTime(r.time)+" · ":""}${r.servings} porciones\n\nIngredientes\n${r.ingredients.map(i=>"• "+i).join("\n")}\n\nPasos\n${r.steps.map((s,i)=>(i+1)+". "+s).join("\n")}`;
  let ok=false;try{await navigator.clipboard.writeText(txt);ok=true}catch(e){const ta=document.createElement("textarea");ta.value=txt;document.body.appendChild(ta);ta.select();try{ok=document.execCommand("copy")}catch(_){}ta.remove();}
  toast(ok?"Receta copiada para compartir":"No pudimos copiarla");
};
A.askDelete=()=>openSheet({t:"delete",id:sheet.id});
A.doDelete=async()=>{
  const r=clone(getR(sheet.id));closeSheet();
  if(S.state.progress&&S.state.progress.id===r.id)setState({progress:null});
  reset();await delRecipe(r.id);
  toast("Receta borrada","Deshacer",()=>putRecipe(r));
};

/* cuenta */
A.reload=()=>location.reload();
A.toEmail=()=>go("email");
A.google=async()=>{
  const p=new F.au.GoogleAuthProvider();
  try{await F.au.signInWithPopup(F.auth,p);}
  catch(e){if(/popup-blocked|operation-not-supported|web-storage/.test(e&&e.code||"")){try{await F.au.signInWithRedirect(F.auth,p)}catch(e2){authErr(e2)}}else authErr(e);}
};
async function sendLink(email){
  await F.au.sendSignInLinkToEmail(F.auth,email,{url:location.origin+location.pathname,handleCodeInApp:true});
  lsSet(LS_EMAIL,email);
}
A.sendLink=async()=>{
  const c=cur(),i=document.getElementById("f-email"),email=(i?i.value:c.email||"").trim();
  if(!okEmail(email)){i&&i.classList.add("err");i&&i.focus();toast("Escribí un email válido");return;}
  c.email=email;c.busy=true;render();
  try{await sendLink(email);c.busy=false;go("sent",{email});}catch(e){c.busy=false;render();authErr(e);}
};
A.resend=async()=>{try{await sendLink(cur().email);toast("Te lo mandamos de nuevo");}catch(e){authErr(e);}};
A.confirmEmail=async()=>{
  const c=cur(),i=document.getElementById("f-email"),email=(i?i.value:"").trim();
  if(!okEmail(email)){i&&i.classList.add("err");i&&i.focus();return;}
  c.email=email;c.busy=true;render();
  if(!await finishEmailLink(email)){stack=[{n:"welcome"}];render();}
};
A.cancelLink=()=>{S.linkPending=null;history.replaceState(null,"",location.pathname);stack=[{n:"welcome"}];render();};
async function renameEverywhere(name){
  S.profile=Object.assign({},S.profile,{name});
  await saveUser({name});
  const mine=S.recipes.filter(r=>isMine(r)&&r.ownerName!==name);
  if(!mine.length)return;
  if(DEMO){mine.forEach(r=>r.ownerName=name);demoSave();return}
  try{const b=F.fs.writeBatch(F.db);mine.slice(0,450).forEach(r=>b.update(recRef(r.id),{ownerName:name}));await b.commit();}catch(e){}
}
A.saveName=async()=>{
  const i=document.getElementById("f-nm"),name=(i?i.value:"").trim();
  if(!name){i&&i.classList.add("err");i&&i.focus();toast("Escribí tu nombre");return;}
  await renameEverywhere(name);reset();
};
A.profile=()=>go("profile");
async function savePname(){
  const c=cur();if(c.n!=="profile"||c.pname==null)return;
  const name=c.pname.trim();if(!name||name===myName())return;
  await renameEverywhere(name);toast("Nombre guardado");render();
}
A.logout=async()=>{closeSheet();cook=null;lockOff();if(DEMO){S.user=null;stack=[{n:"welcome"}];render();return}try{await F.au.signOut(F.auth)}catch(e){toast("No pudimos cerrar la sesión");}};

/* drafts */
A.addManual=()=>{closeSheet();draft=blank();go("manual",{s:1});};
A.cancelDraft=()=>{draft=null;reset();};
A.dsv=(el)=>{draft.servings=Math.max(1,Math.min(99,(+draft.servings||1)+ +el.dataset.d));const s=el.parentNode.querySelector("[data-sv]");s&&(s.textContent=draft.servings);};
A.addIng=()=>{draft.ings.push({q:"",n:""});keepScroll(()=>{});const q=app.querySelectorAll('[data-bind^="iq."]');q[q.length-1]&&q[q.length-1].focus();};
A.rmIng=(el)=>{draft.ings.splice(+el.dataset.i,1);if(!draft.ings.length)draft.ings.push({q:"",n:""});keepScroll(()=>{});};
A.addStep=()=>{draft.steps.push("");keepScroll(()=>{});const q=app.querySelectorAll('[data-bind^="st."]');q[q.length-1]&&q[q.length-1].focus();};
A.wnext=()=>{const c=cur();if(c.s===1&&!draft.name.trim()){const i=document.getElementById("f-name");i&&i.focus();toast("Ponele un nombre a la receta");return;}c.s++;scrollTo(0,0);render();};
A.wprev=()=>{cur().s--;scrollTo(0,0);render();};
A.saveDraft=async()=>{
  const r=fromDraft(draft);
  const d=findDup(r);
  if(d){openSheet({t:"dup",existingId:d.id,existingName:d.name,since:d.createdAt});return;}
  await finishSave(r);
};
async function finishSave(r){if(await putRecipe(r)){draft=null;reset("detail",{id:r.id});toast("Guardada en tus recetas");}}
A.openExisting=()=>{const id=sheet.existingId;closeSheet();draft=null;reset("detail",{id});};
A.saveCopy=async()=>{closeSheet();const r=fromDraft(draft);r.name=r.name+" (copia)";await finishSave(r);};

/* photo */
const photoIn=document.getElementById("photoIn");
A.pickPhoto=()=>{closeSheet();photoIn.value="";photoIn.click();};
A.photoMenu=()=>openSheet({t:"photo"});
A.rmPhoto=()=>{closeSheet();delete draft.photo;delete draft.photoCutout;delete draft.photoTrim;keepScroll(()=>{});};
photoIn.addEventListener("change",async()=>{
  const f=photoIn.files&&photoIn.files[0];if(!f||!draft)return;
  try{const x=await shrink(f,900,.8);draft.photo=x.data;if(x.cut){draft.photoCutout=true;draft.photoTrim=true;}else{delete draft.photoCutout;delete draft.photoTrim;}keepScroll(()=>{});}catch(e){toast("No pudimos abrir esa foto");}
});
// Removes a plain light background (white or the old beige fill) that touches the edges.
// iPhone turns gallery images into JPEG on upload, so a cut-out plate arrives with a white
// background; this flood-fills it from the borders and leaves the dish with a soft edge.
function whiteCut(c){
  const w=c.width,h=c.height,cx=c.getContext("2d"),id=cx.getImageData(0,0,w,h),d=id.data;
  const near=p=>{const i=p*4,r=d[i],g=d[i+1],b=d[i+2],mn=Math.min(r,g,b);return d[i+3]>0&&mn>226&&Math.max(r,g,b)-mn<24;};
  let tot=0,wh=0;const chk=p=>{tot++;if(near(p))wh++;};
  for(let x=0;x<w;x+=2){chk(x);chk((h-1)*w+x);}for(let y=0;y<h;y+=2){chk(y*w);chk(y*w+w-1);}
  if(!tot||wh/tot<0.85)return false;
  const seen=new Uint8Array(w*h),st=[];
  const push=p=>{if(!seen[p]&&near(p)){seen[p]=1;st.push(p);}};
  for(let x=0;x<w;x++){push(x);push((h-1)*w+x);}for(let y=0;y<h;y++){push(y*w);push(y*w+w-1);}
  while(st.length){const p=st.pop(),x=p%w;if(x>0)push(p-1);if(x<w-1)push(p+1);if(p>=w)push(p-w);if(p<w*(h-1))push(p+w);}
  let cleared=0;for(let p=0;p<w*h;p++)if(seen[p]){d[p*4+3]=0;cleared++;}
  if(cleared<w*h*0.05||cleared>w*h*0.97)return false;
  for(let p=0;p<w*h;p++){if(seen[p])continue;const x=p%w;
    if((x>0&&seen[p-1])||(x<w-1&&seen[p+1])||(p>=w&&seen[p-w])||(p<w*(h-1)&&seen[p+w])){const i=p*4,m=Math.min(d[i],d[i+1],d[i+2]);if(m>170)d[i+3]=Math.max(0,Math.min(255,Math.round(255*(255-m)/85)));}}
  cx.putImageData(id,0,0);return true;
}
// Draws an image scaled to fit `m` px on a transparent canvas.
function drawFit(im,m,bg){let w=im.naturalWidth||im.width,h=im.naturalHeight||im.height;const k=Math.min(1,m/Math.max(w,h));w=Math.max(1,Math.round(w*k));h=Math.max(1,Math.round(h*k));
  const c=document.createElement("canvas");c.width=w;c.height=h;const cx=c.getContext("2d");if(bg){cx.fillStyle=bg;cx.fillRect(0,0,w,h);}cx.drawImage(im,0,0,w,h);return c;}
// Crops a transparent canvas to the dish, leaving a small margin, so it fills the cover like the drawings.
function trimCanvas(c){
  const w=c.width,h=c.height,d=c.getContext("2d").getImageData(0,0,w,h).data;
  let x0=w,y0=h,x1=-1,y1=-1;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]>12){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
  if(x1<0)return c;
  const pad=Math.round(Math.max(x1-x0,y1-y0)*0.03);
  x0=Math.max(0,x0-pad);y0=Math.max(0,y0-pad);x1=Math.min(w-1,x1+pad);y1=Math.min(h-1,y1+pad);
  const o=document.createElement("canvas");o.width=x1-x0+1;o.height=y1-y0+1;o.getContext("2d").drawImage(c,x0,y0,o.width,o.height,0,0,o.width,o.height);return o;
}
function fitCanvas(c,m){const k=Math.min(1,m/Math.max(c.width,c.height));if(k===1)return c;const o=document.createElement("canvas");o.width=Math.max(1,Math.round(c.width*k));o.height=Math.max(1,Math.round(c.height*k));o.getContext("2d").drawImage(c,0,0,o.width,o.height);return o;}
// PNG with transparency, cropped to the dish and shrunk until it fits in the recipe document (~230 KB).
function cutPng(im,max,needsWhiteCut){
  const big=drawFit(im,1600,null);
  if(needsWhiteCut&&!whiteCut(big))return null;
  const t=trimCanvas(big);
  for(const m of [max,720,560,440,340,260]){const out=fitCanvas(t,m).toDataURL("image/png");if(out.length<=230000||m===260)return out;}
  return null;
}
// Shrinks a photo before saving. Cut-out photos (transparent, or on a plain white background)
// are kept as transparent PNG so they sit on the blue cover like the drawings; the rest become JPEG.
function shrink(file,max,q){
  return new Promise((res,rej)=>{
    const url=URL.createObjectURL(file);const im=new Image();
    im.onload=()=>{
      URL.revokeObjectURL(url);
      let alpha=false;
      try{const t=drawFit(im,160,null),d=t.getContext("2d").getImageData(0,0,t.width,t.height).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i]<200)n++;alpha=n>(d.length/4)*0.02;}catch(e){}
      if(alpha){res({data:cutPng(im,max,false),cut:true});return;}
      let white=false;try{white=whiteCut(drawFit(im,200,null));}catch(e){}
      if(white){const out=cutPng(im,max,true);if(out){res({data:out,cut:true});return;}}
      const c=drawFit(im,max,"#F1F0EC");let out=c.toDataURL("image/jpeg",q);if(out.length>230000)out=c.toDataURL("image/jpeg",.6);
      if(out.length>230000)out=drawFit(im,Math.round(max*.7),"#F1F0EC").toDataURL("image/jpeg",.65);
      res({data:out,cut:false});
    };
    im.onerror=()=>{URL.revokeObjectURL(url);rej();};im.src=url;
  });
}
// Photos saved before cut-outs existed: when the owner opens the recipe, remove the plain
// background once and save it. Checked recipes are marked so this runs only once each.
const fixing=new Set();
function fixOldPhoto(r){
  if(!r||!isMine(r)||!r.photo||fixing.has(r.id))return;
  const jpeg=/^data:image\/jpeg/.test(r.photo);
  const needCut=jpeg&&!r.photoCutout&&!r.photoChecked;
  const needTrim=r.photoCutout&&!r.photoTrim;
  if(!needCut&&!needTrim)return;
  fixing.add(r.id);
  const im=new Image();
  im.onload=async()=>{
    let out=null;try{out=needCut?cutPng(im,900,true):cutPng(im,900,false);}catch(e){}
    const r2=clone(getR(r.id)||r);
    if(out){r2.photo=out;r2.photoCutout=true;r2.photoTrim=true;}else r2.photoChecked=true;
    await putRecipe(r2);
  };
  im.onerror=()=>{};im.src=r.photo;
}

/* csv */
const csvIn=document.getElementById("csvIn");
A.addCsv=()=>{closeSheet();csv=null;if(cur().n==="csvdone")reset("csv");else go("csv");};
A.chooseCsv=()=>{csvIn.value="";csvIn.click();};
function parseCSV(text){
  text=text.replace(/^﻿/,"");
  const first=text.split(/\r?\n/)[0]||"";
  const delim=(first.match(/;/g)||[]).length>(first.match(/,/g)||[]).length?";":(first.includes("\t")?"\t":",");
  const rows=[];let row=[],f="",q=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(q){if(ch==='"'){if(text[i+1]==='"'){f+='"';i++}else q=false}else f+=ch;}
    else if(ch==='"')q=true;
    else if(ch===delim){row.push(f);f="";}
    else if(ch==="\n"||ch==="\r"){if(ch==="\r"&&text[i+1]==="\n")i++;row.push(f);rows.push(row);row=[];f="";}
    else f+=ch;
  }
  if(f||row.length){row.push(f);rows.push(row);}
  return rows.filter(r=>r.some(c=>c.trim()));
}
function guessField(h){const n=norm(h);
  if(/^(nombre|titulo|receta|name|title)/.test(n))return"name";
  if(/(tiempo|minutos|duracion|time)/.test(n))return"time";
  if(/(porcion|personas|servings|raciones)/.test(n))return"servings";
  if(/(ingrediente|ingredients)/.test(n))return"ingredients";
  if(/(paso|preparacion|instruccion|steps|procedimiento)/.test(n))return"steps";
  return"skip";}
csvIn.addEventListener("change",()=>{
  const file=csvIn.files&&csvIn.files[0];if(!file)return;
  const rd=new FileReader();
  rd.onload=()=>{
    const rows=parseCSV(String(rd.result||""));
    if(rows.length<2){csv={err:"El archivo no tiene recetas o no es un CSV."};if(cur().n!=="csv")reset("csv");else render();return;}
    const headers=rows[0].map(s=>s.trim()),map=headers.map(guessField),seen=new Set();
    map.forEach((m,i)=>{if(m!=="skip"){if(seen.has(m))map[i]="skip";else seen.add(m);}});
    csv={file:file.name,headers,rows:rows.slice(1),map};
    if(cur().n==="csvmap")render();else go("csvmap");
  };
  rd.onerror=()=>{csv={err:"No pudimos leer el archivo."};render();};
  rd.readAsText(file);
});
function splitCell(s){s=String(s||"").trim();if(!s)return[];let parts=s.split(/\r?\n|\|/);if(parts.length===1&&s.includes(";"))parts=s.split(";");return parts.map(x=>x.replace(/^([-•*]|\d+[.)])\s*/,"").trim()).filter(Boolean);}
A.csvRows=()=>{
  const items=csv.rows.map(row=>{
    const r={id:newId(),name:"",time:0,servings:4,ingredients:[],steps:[],fav:false,createdAt:Date.now()};
    csv.map.forEach((m,i)=>{const v=(row[i]||"").trim();
      if(m==="name")r.name=v;else if(m==="time")r.time=parseTimeInput(v);else if(m==="servings")r.servings=parseInt(v)||4;
      else if(m==="ingredients")r.ingredients=splitCell(v);else if(m==="steps")r.steps=splitCell(v);});
    return r;}).filter(r=>r.name);
  const names=new Set(S.recipes.filter(isMine).map(x=>norm(x.name)));
  csv.items=items.map(r=>{const dup=names.has(norm(r.name));return{r,dup,on:!dup};});
  if(!csv.items.length){toast("No encontramos filas con nombre");return;}
  go("csvpick");
};
A.csvToggle=(el)=>{const x=csv.items[+el.dataset.i];x.on=!x.on;keepScroll(()=>{});};
A.csvAll=()=>{const all=csv.items.every(x=>x.on);csv.items.forEach(x=>x.on=!all);keepScroll(()=>{});};
A.csvImport=async()=>{
  const sel=csv.items.filter(x=>x.on).map(x=>x.r);const skipped=csv.items.filter(x=>x.dup&&!x.on);
  let ok=0;const t0=Date.now();for(const r of sel){r.createdAt=t0+ok;if(await putRecipe(r))ok++;else break;}
  csv=null;reset("csvdone",{count:ok,skipped:skipped.length===1?skipped[0].r.name:skipped.length>1?skipped.length+" recetas":""});
};
A.template=async()=>{
  const t='nombre,tiempo,porciones,ingredientes,pasos\n"Tarta de zapallitos",50 min,4,"1 tapa de tarta|3 zapallitos|1 cebolla|3 huevos|100 g de queso rallado","Rallá los zapallitos y salteálos con la cebolla 10 minutos.|Mezclá con los huevos y el queso.|Rellená la tapa y horneá 30 minutos."\n';
  try{const u=URL.createObjectURL(new Blob(["\ufeff"+t],{type:"text/csv"}));const a=document.createElement("a");a.href=u;a.download="plantilla-recetas.csv";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2000);}
  catch(e){try{await navigator.clipboard.writeText(t);toast("Copiamos la plantilla");}catch(_){toast("No pudimos descargar la plantilla");}}
};

/* cooking */
A.cook=()=>{const c=cur();const r=getR(c.id);cook={id:r.id,step:0,sv:c.sv||r.servings,checked:new Set(),timer:null};lockOn();go("prep");};
A.resumeCook=()=>{const p=S.state.progress;const r=getR(p.id);cook={id:r.id,step:Math.min(p.step,r.steps.length-1),sv:p.sv||r.servings,checked:new Set(),timer:null};lockOn();stack=[{n:"home"},{n:"detail",id:r.id},{n:"step"}];scrollTo(0,0);render();};
A.tick=(el)=>{const i=+el.dataset.i;cook.checked.has(i)?cook.checked.delete(i):cook.checked.add(i);keepScroll(()=>{});};
A.startCook=()=>replace("step");
A.leaveCookPrep=()=>{cook=null;lockOff();back();};
A.nextStep=()=>{cook.step++;scrollTo(0,0);render();};
A.prevStep=()=>{cook.step--;scrollTo(0,0);render();};
A.stepsSheet=()=>openSheet({t:"steps"});
A.jumpStep=(el)=>{cook.step=+el.dataset.i;closeSheet();scrollTo(0,0);render();};
A.askExit=()=>openSheet({t:"exit"});
A.exitCook=async()=>{closeSheet();const id=cook.id;stopTick();stopAlarm();await setState({progress:{id,step:cook.step,sv:cook.sv,at:Date.now()}});cook=null;lockOff();reset("detail",{id});};
A.finish=()=>{stopTick();cook.timer=null;if(S.state.progress)setState({progress:null});replace("done");};
async function saveDone(){}
A.doneBack=async()=>{const id=cook.id;await saveDone();cook=null;lockOff();reset("detail",{id});};
A.doneHome=async()=>{await saveDone();cook=null;lockOff();reset();};
/* timer */
let tick=null;
function startTick(){stopTick();tick=setInterval(onTick,250);}
function stopTick(){clearInterval(tick);tick=null;}
function onTick(){
  if(!cook||!cook.timer){stopTick();return;}
  const left=timerLeft(),txt=fmtClock(left);
  const num=document.getElementById("tnum"),mini=document.getElementById("tmini");
  if(num&&num.textContent!==txt){num.textContent=txt;fitCount();}
  if(mini)mini.textContent=txt;
  if(left<=0&&cook.timer.running){cook.timerDoneStep=cook.timer.stepIdx;cook.timer=null;stopTick();ring();if(cur().n==="timer")replace("timerdone");else go("timerdone");}
}
A.startTimer=(el)=>{const m=+el.dataset.m;cook.timer={total:m*60,left:m*60,endAt:Date.now()+m*60000,running:true,stepIdx:cook.step};unlockAudio();startTick();go("timer");};
A.showTimer=()=>{unlockAudio();go("timer");};
A.hideTimer=()=>back();
A.toggleTimer=()=>{unlockAudio();const t=cook.timer;if(t.running){t.left=timerLeft();t.running=false;}else{t.endAt=Date.now()+t.left*1000;t.running=true;}render();};
A.plus5=()=>{unlockAudio();const t=cook.timer;if(t.running)t.endAt+=300000;else t.left+=300;t.total+=300;render();};
A.plus5done=()=>{stopAlarm();cook.timer={total:300,left:300,endAt:Date.now()+300000,running:true,stepIdx:cook.timerDoneStep};startTick();stack=stack.filter(x=>x.n!=="timerdone");stack.push({n:"timer"});render();};
A.ackTimer=()=>{stopAlarm();cook.step=cook.timerDoneStep;stack=stack.filter(x=>x.n!=="timer"&&x.n!=="timerdone");scrollTo(0,0);render();};
A.ackNext=()=>{stopAlarm();cook.step=cook.timerDoneStep+1;stack=stack.filter(x=>x.n!=="timer"&&x.n!=="timerdone");scrollTo(0,0);render();};
// ---- timer alarm ----
// iPhone keeps Web Audio quiet in silent mode and ignores vibration, so the alarm is a looping
// <audio> clip (a generated beep-beep-beep) with the audio session set to "playback", which
// plays even with the ringer off. It is unlocked on the tap that starts the timer and keeps
// ringing until you act on it (up to 2 minutes). Web Audio beeps are the fallback.
let actx=null,alarmEl=null,alarmUrl=null,alarmStop=null,beepT=null,titleT=null;
function alarmWav(){
  if(alarmUrl)return alarmUrl;
  const sr=22050,n=Math.floor(sr*1.6),buf=new ArrayBuffer(44+n*2),v=new DataView(buf);
  const w=(o,t)=>{for(let i=0;i<t.length;i++)v.setUint8(o+i,t.charCodeAt(i));};
  w(0,"RIFF");v.setUint32(4,36+n*2,true);w(8,"WAVE");w(12,"fmt ");v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);
  v.setUint32(24,sr,true);v.setUint32(28,sr*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);w(36,"data");v.setUint32(40,n*2,true);
  for(let i=0;i<n;i++){const t=i/sr;let a=0;for(const st of [0,.25,.5]){const u=t-st;if(u>=0&&u<.18){const env=Math.min(1,u/.01)*Math.min(1,(.18-u)/.04);a+=env*(Math.sin(2*Math.PI*880*u)*.75+Math.sin(2*Math.PI*1760*u)*.15);}}
    v.setInt16(44+i*2,Math.max(-1,Math.min(1,a))*30000,true);}
  alarmUrl=URL.createObjectURL(new Blob([buf],{type:"audio/wav"}));return alarmUrl;
}
function playbackSession(){try{if(navigator.audioSession)navigator.audioSession.type="playback";}catch(e){}}
function unlockAudio(){
  playbackSession();
  try{
    if(!alarmEl){alarmEl=new Audio(alarmWav());alarmEl.loop=true;alarmEl.preload="auto";alarmEl.setAttribute("playsinline","");}
    if(alarmEl.paused){alarmEl.muted=true;const p=alarmEl.play();if(p)p.then(()=>{if(!beepT&&!alarmStop){alarmEl.pause();alarmEl.currentTime=0;}alarmEl.muted=false;}).catch(()=>{alarmEl.muted=false;});}
  }catch(e){}
  try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();actx.resume&&actx.resume();}catch(e){}
}
function beep(){if(!actx)return;try{const t=actx.currentTime;[0,.25,.5].forEach(d=>{const o=actx.createOscillator(),g=actx.createGain();o.frequency.value=880;o.connect(g);g.connect(actx.destination);g.gain.setValueAtTime(0.0001,t+d);g.gain.exponentialRampToValueAtTime(0.3,t+d+.02);g.gain.exponentialRampToValueAtTime(0.0001,t+d+.18);o.start(t+d);o.stop(t+d+.2);});}catch(e){}}
function flashTitle(on){clearInterval(titleT);titleT=null;document.title="Recetario";if(on){let k=0;titleT=setInterval(()=>{document.title=(k++%2)?"Recetario":"⏰ ¡Listo el timer!";},1000);}}
function ring(){
  stopAlarm();playbackSession();
  let ok=false;
  try{if(alarmEl){alarmEl.muted=false;alarmEl.currentTime=0;const p=alarmEl.play();ok=true;if(p)p.catch(()=>{if(!beepT){beep();beepT=setInterval(beep,1600);}});}}catch(e){}
  if(!ok){beep();beepT=setInterval(beep,1600);}
  try{navigator.vibrate&&navigator.vibrate([400,200,400,200,400]);}catch(e){}
  flashTitle(true);
  alarmStop=setTimeout(stopAlarm,120000);
}
function stopAlarm(){clearInterval(beepT);beepT=null;clearTimeout(alarmStop);alarmStop=null;try{if(alarmEl){alarmEl.pause();alarmEl.currentTime=0;}}catch(e){}flashTitle(false);}

/* ================= events ================= */
document.addEventListener("click",e=>{
  const el=e.target.closest("[data-act]");if(!el)return;
  const f=A[el.dataset.act];if(f){e.preventDefault();f(el);}
});
document.addEventListener("input",e=>{
  const el=e.target;const b=el.dataset&&el.dataset.bind;if(!b)return;
  const c=cur();
  if(b==="q"){c.q=el.value;updateHomeList();return;}
  if(b.startsWith("map."))return;
  if(b==="email"||b==="nm"||b==="pname"){c[b]=el.value;el.classList.remove("err");return;}
  if(!draft)return;
  if(el.tagName==="TEXTAREA")grow(el);
  const[k,i]=b.split(".");
  if(k==="iq")draft.ings[+i].q=el.value;
  else if(k==="in")draft.ings[+i].n=el.value;
  else if(k==="st")draft.steps[+i]=el.value;
  else draft[k]=el.value;
});
document.addEventListener("focusout",e=>{if(e.target&&e.target.id==="f-pname")savePname();});
document.addEventListener("change",e=>{const el=e.target;const b=el.dataset&&el.dataset.bind;if(b&&b.startsWith("map.")){csv.map[+b.slice(4)]=el.value;keepScroll(()=>{});}});
document.addEventListener("keydown",e=>{
  if(e.key!=="Enter")return;
  const b=e.target.dataset&&e.target.dataset.bind||"";
  if(e.target.id==="q"||e.target.id==="f-pname"){e.target.blur();return;}
  if(e.target.id==="f-email"){e.preventDefault();(cur().confirm?A.confirmEmail:A.sendLink)();return;}
  if(e.target.id==="f-nm"){e.preventDefault();A.saveName();return;}
  if(draft&&(b.startsWith("in.")||b.startsWith("iq."))){e.preventDefault();const i=+b.split(".")[1];if(i===draft.ings.length-1)A.addIng();else{const n=app.querySelector(`[data-bind="iq.${i+1}"]`);n&&n.focus();}}
});

if(DEMO)window.__demo={startTick,unlockAudio,alarmState:()=>({el:!!alarmEl,paused:alarmEl?alarmEl.paused:null,title:document.title}),go,reset,setCook:o=>{cook=Object.assign(cook||{checked:new Set()},o);},setCsv:o=>{csv=o;}};
render();
initStore();
})();
</script>
