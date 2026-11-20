<script>
(()=>{
"use strict";
const ICONS=/*ICONS*/;
const DRAW=/*DRAWINGS*/;
const ILL_KEYS=["pasta","tarta","sopa"];
const ALIAS={plato:"pasta",tomate:"sopa",limon:"tarta",huevo:"pasta",palta:"sopa",pan:"tarta"};
const ic=(n,s=22)=>`<svg width="${s}" height="${s}" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="${ICONS[n]||""}"/></svg>`;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const norm=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/\s+/g," ").trim();
const newId=()=>"r"+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const clone=o=>JSON.parse(JSON.stringify(o));
const fmtTime=m=>{m=+m||0;if(!m)return"";if(m<60)return m+" min";const h=Math.floor(m/60),r=m%60;return h+" h"+(r?" "+r:"");};
function illKey(r){
  const nm=norm(r&&r.name);
  if(/\b(sopa|caldo|locro|guiso|crema de|puchero|estofado|cazuela)/.test(nm))return"sopa";
  if(/\b(tarta|torta|pie|flan|tiramisu|postre|budin|bizcochuelo|alfajor|galletit|mousse|helado|brownie|cheesecake|pastel|dulce)/.test(nm))return"tarta";
  if(/\b(fideo|pasta|ragu|noqui|tallarin|ravioli|lasagna|lasana|sorrentino|canelon|spaghetti|risotto|arroz)/.test(nm))return"pasta";
  if(r&&r.category==="Sopas")return"sopa";
  if(r&&r.category==="Dulces")return"tarta";
  if(r&&r.category==="Pastas")return"pasta";
  if(r&&DRAW[r.drawing])return r.drawing;
  if(r&&ALIAS[r.drawing])return ALIAS[r.drawing];
  const id=String(r&&r.id||"x");let h=0;for(const c of id)h=(h*31+c.charCodeAt(0))>>>0;return ILL_KEYS[h%3];
}
const ill=k=>`<img class="ill" src="${DRAW[k]||DRAW.pasta}" alt="" draggable="false">`;
const fullPhoto=r=>!!(r&&r.photo&&!r.photoCutout);
const pic=r=>r&&r.photo?(r.photoCutout?`<img class="ill" src="${esc(r.photo)}" alt="" draggable="false">`:`<img class="photo" src="${esc(r.photo)}" alt="">`):ill(illKey(r));
document.getElementById("deskArt").innerHTML=ill("pasta");
