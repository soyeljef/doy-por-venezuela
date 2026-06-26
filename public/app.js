// ============================================================
//  Doy por Venezuela — Lógica de la app (Supabase)
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CFG = window.APP_CONFIG || {};
const CATS = [
  {id:"alimento",label:"Alimento",emoji:"🍚"},{id:"ropa",label:"Ropa",emoji:"🧥"},
  {id:"herram",label:"Herramienta",emoji:"🔧"},{id:"maquin",label:"Maquinaria",emoji:"🚜"},
  {id:"medico",label:"Implementos médicos",emoji:"💊"},{id:"manoobra",label:"Mano de obra",emoji:"🤝"},
  {id:"transp",label:"Transporte",emoji:"🚚"},{id:"acopio",label:"Punto de acopio",emoji:"📍"},
  {id:"otros",label:"Otro",emoji:"📦"},
];
const PAISES = ["Venezuela","Colombia","México","España","Perú","Argentina","Chile","Ecuador","Bolivia","Panamá","República Dominicana","Estados Unidos","Otro"];
const catById = id => CATS.find(c=>c.id===id) || CATS[CATS.length-1];

let ITEMS=[], filterCat="", filterType="", postType="ofrezco", pendingAction=null, confirmCb=null, sb=null, geo=null;

/* ---------- Config check ---------- */
function configReady(){
  return CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY &&
         !CFG.SUPABASE_URL.includes("TU-PROYECTO") && !CFG.SUPABASE_ANON_KEY.includes("PEGA_AQUI");
}

/* ---------- Ownership (localStorage) ---------- */
function getMine(){ try{ return JSON.parse(localStorage.getItem("dpv_mine")||"{}"); }catch(e){ return {}; } }
function rememberMine(id,code){ const m=getMine(); m[id]=code; localStorage.setItem("dpv_mine",JSON.stringify(m)); }
function isMine(id){ return getMine()[id]; }
function forgetMine(id){ const m=getMine(); delete m[id]; localStorage.setItem("dpv_mine",JSON.stringify(m)); }

/* ---------- Supabase data ---------- */
async function loadItems(){
  if(!sb) return;
  const { data, error } = await sb.from("items_public").select("*").order("created_at",{ascending:false}).limit(500);
  if(error){ showErr("No se pudo leer el tablón. Revisa tu conexión e intenta Actualizar."); return; }
  ITEMS = data || []; clearErr(); rebuildCities(); render();
}
async function rpc(name, args){ const { data, error } = await sb.rpc(name, args); if(error) throw error; return data; }

/* ---------- Helpers ---------- */
function $(id){ return document.getElementById(id); }
function showErr(m){ $("errBox").innerHTML = '<div class="err">'+m+'</div>'; }
function clearErr(){ $("errBox").innerHTML=""; }
function esc(s){ return (s||"").replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function timeAgo(ts){ const t=typeof ts==="number"?ts:Date.parse(ts); const s=Math.floor((Date.now()-t)/1000);
  if(s<60)return"hace un momento"; const m=Math.floor(s/60); if(m<60)return"hace "+m+" min";
  const h=Math.floor(m/60); if(h<24)return"hace "+h+" h"; const d=Math.floor(h/24); return"hace "+d+" día"+(d>1?"s":""); }
function catLabel(i){ const c=catById(i.categoria); let l=c.emoji+" "+c.label; if(i.categoria==="ropa"&&i.ropa) l+=" · "+i.ropa; return l; }
function locText(i){ return [i.ciudad,i.pais].filter(Boolean).join(", "); }
function rebuildCities(){ const sel=$("cityFilter"); const cur=sel.value;
  const cities=[...new Set(ITEMS.map(i=>i.ciudad).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
  sel.innerHTML='<option value="">Todas las ciudades</option>'+cities.map(c=>`<option>${esc(c)}</option>`).join('');
  sel.value=cities.includes(cur)?cur:""; }
function currentList(){
  const q=$("search").value.trim().toLowerCase(); const city=$("cityFilter").value; const hide=$("hideTaken").checked;
  return ITEMS.filter(i=>{
    if(filterType&&i.tipo!==filterType)return false;
    if(filterCat&&i.categoria!==filterCat)return false;
    if(city&&i.ciudad!==city)return false;
    if(hide&&i.estado==='tomado')return false;
    if(q){ const blob=(i.titulo+' '+i.ciudad+' '+(i.pais||'')+' '+(i.nombre||'')+' '+catById(i.categoria).label+' '+(i.nota||'')+' '+(i.dir||'')).toLowerCase(); if(!blob.includes(q))return false; }
    return true;
  });
}

/* ---------- Render ---------- */
function render(){
  const board=$("board");
  $("countOffer").textContent=ITEMS.filter(i=>i.tipo==='ofrezco'&&i.estado!=='tomado').length;
  $("countNeed").textContent=ITEMS.filter(i=>i.tipo==='necesito'&&i.estado!=='tomado').length;
  $("countTaken").textContent=ITEMS.filter(i=>i.estado==='tomado').length;
  const list=currentList();
  if(ITEMS.length===0){ board.innerHTML='<div class="empty"><h3>El tablón está vacío</h3><p>Sé la primera persona en publicar. Toca “Publicar”.</p></div>'; return; }
  if(list.length===0){ board.innerHTML='<div class="empty"><h3>Sin resultados</h3><p>Prueba con otra búsqueda, ciudad, categoría o pestaña.</p></div>'; return; }
  board.innerHTML='<div class="grid">'+list.map(i=>cardHTML(i,!!isMine(i.id))).join('')+'</div>';
}
function cardHTML(i,owner){
  const need=i.tipo==='necesito', taken=i.estado==='tomado';
  const stampTxt=need?'Cubierto':'Entregado';
  const stamp=taken?`<div class="stamp${i._justTaken?' animate':''}">${stampTxt}</div>`:'';
  const cantidad=i.cantidad?`<div class="row"><span class="k">${need?'Cuánto':'Cantidad'}</span><span>${esc(i.cantidad)}</span></div>`:'';
  const dir=i.dir?`<div class="row"><span class="k">${need?'Recibe en':'Lugar'}</span><span>${esc(i.dir)}</span></div>`:'';
  const map=(i.lat&&i.lng)?`<div class="row"><span class="k"></span><a class="maplink" target="_blank" rel="noopener" href="https://www.google.com/maps?q=${i.lat},${i.lng}">📍 Ver en mapa</a></div>`:'';
  const nombre=i.nombre?`<div class="row"><span class="k">${need?'Pide':'Ofrece'}</span><span>${esc(i.nombre)}</span></div>`:'';
  const nota=i.nota?`<p class="note">“${esc(i.nota)}”</p>`:'';

  let actions='';
  if(!taken){
    const waLabel=need?'🤝 Quiero ayudar':'🙏 Lo necesito';
    actions+=`<button class="btn btn-wa" data-act="wa" data-id="${i.id}">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zM6.597 20.13c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.82 9.82 0 001.523 5.26l-.999 3.648 3.965-1.607zM17.5 14.92c-.075-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
      ${waLabel}</button>`;
    actions+=`<button class="btn btn-ghost btn-sm btn-block" style="margin-top:8px" data-act="gone" data-id="${i.id}" data-need="${need?1:0}">Ya no está ${need?'pendiente':'disponible'}</button>`;
    if(owner) actions+=`<button class="btn btn-ghost btn-sm btn-block" style="margin-top:8px" data-act="del" data-id="${i.id}">🗑 Borrar mi publicación</button>`;
  }else{
    if(owner){
      actions+=`<div class="owner-row"><button class="btn btn-ghost btn-sm" style="flex:1" data-act="reopen" data-id="${i.id}">↩ Reabrir</button><button class="btn btn-ghost btn-sm" data-act="del" data-id="${i.id}">🗑 Borrar</button></div>`;
    }else{
      actions+=`<button class="btn btn-ghost btn-sm btn-block" style="margin-top:8px" data-act="askreopen" data-id="${i.id}">Yo publiqué · reabrir</button>`;
    }
  }
  return `<div class="card ${need?'need':'offer'} ${taken?'taken':''}">
    ${stamp}
    <span class="badge ${need?'need':'offer'}">${need?'🙋 Necesita':'🤲 Ofrece'}</span>
    <span class="cat">${catLabel(i)}</span>
    <h3>${esc(i.titulo)}</h3>
    <div class="meta">${cantidad}<div class="row"><span class="k">Ubicación</span><span>${esc(locText(i))||'—'}</span></div>${dir}${map}${nombre}</div>
    ${nota}
    <div class="stamp-area"><span class="ago">${timeAgo(i.created_at)}</span></div>
    <div class="actions">${actions}</div>
  </div>`;
}

/* ---------- Card actions (event delegation) ---------- */
$("board").addEventListener("click",e=>{
  const b=e.target.closest("[data-act]"); if(!b) return;
  const id=b.dataset.id, act=b.dataset.act;
  if(act==="wa") contactWA(id);
  else if(act==="gone") markGone(id, b.dataset.need==="1");
  else if(act==="del") askDelete(id);
  else if(act==="reopen") reopen(id);
  else if(act==="askreopen") askReopen(id);
});

function contactWA(id){
  const i=ITEMS.find(x=>x.id===id); if(!i) return;
  const phone=(i.cc||'')+(i.tel||'').replace(/\D/g,'');
  const loc=locText(i);
  let msg;
  if(i.tipo==='necesito') msg=`Hola 👋 Vi en ${CFG.BRAND} que necesitas: "${i.titulo}"${loc?(' ('+loc+')'):''}. Puedo ayudarte con eso, ¿coordinamos?`;
  else msg=`Hola 🙏 Gracias por tu ayuda. Vi que ofreces "${i.titulo}"${loc?(' ('+loc+')'):''} en ${CFG.BRAND} y necesito tu ayuda. ¿Sigue disponible?`;
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,"_blank","noopener");
}
async function setTaken(id,val){
  const i=ITEMS.find(x=>x.id===id); if(!i) return;
  try{
    if(val) await rpc("mark_taken",{p_id:id});
    else{ const code=isMine(id); const ok=await rpc("reopen_item",{p_id:id,p_code:code}); if(!ok){ showErr("No se pudo reabrir."); return; } }
  }catch(e){ showErr("No se pudo guardar el cambio. Intenta de nuevo."); return; }
  i.estado=val?'tomado':'disponible'; i.taken_at=val?new Date().toISOString():null; if(val) i._justTaken=true;
  render(); setTimeout(()=>{ i._justTaken=false; },600);
}
async function reopen(id){ await setTaken(id,false); }
function markGone(id){
  askConfirm("¿Quitar esto de la lista?",
    "¿Seguro que ya no está disponible? Recuerda que alguien más podría necesitarlo. Confírmalo solo si de verdad ya fue entregado o tomado.",
    ()=>setTaken(id,true));
}
function askReopen(id){ pendingAction={type:'reopen',id}; openAsk("Reabrir publicación","Ingresa tu código para volver a marcarla como activa."); }
function askDelete(id){ askConfirm("¿Borrar tu publicación?","Esto la elimina del tablón para siempre. No se puede deshacer.",()=>doDelete(id)); }
async function doDelete(id){
  const code=isMine(id);
  try{ const ok=await rpc("delete_item",{p_id:id,p_code:code}); if(!ok){ showErr("No se pudo borrar (¿código no válido?)."); return; } }
  catch(e){ showErr("No se pudo borrar. Intenta de nuevo."); return; }
  forgetMine(id); ITEMS=ITEMS.filter(x=>x.id!==id); rebuildCities(); render();
}

/* ---------- Confirm (heart) modal ---------- */
function askConfirm(title,msg,cb){ $("cTitle").textContent=title; $("cMsg").textContent=msg; confirmCb=cb; $("confirmOverlay").classList.add("open"); }
$("cYes").onclick=()=>{ const cb=confirmCb; confirmCb=null; closeAll(); if(cb) cb(); };

/* ---------- Code modal ---------- */
function openAsk(title,lead){ $("askTitle").textContent=title; $("askLead").textContent=lead; $("askCode").value=""; $("askErr").textContent=""; $("askOverlay").classList.add("open"); setTimeout(()=>$("askCode").focus(),50); }
$("askConfirm").onclick=async()=>{
  if(!pendingAction) return;
  const code=$("askCode").value.trim().toUpperCase();
  const i=ITEMS.find(x=>x.id===pendingAction.id); if(!i){ closeAll(); return; }
  if(pendingAction.type==='reopen'){
    try{ const ok=await rpc("reopen_item",{p_id:i.id,p_code:code}); if(!ok){ $("askErr").textContent="Código incorrecto. Revisa e intenta otra vez."; return; } }
    catch(e){ $("askErr").textContent="Error de conexión. Intenta de nuevo."; return; }
    rememberMine(i.id,code); i.estado='disponible'; i.taken_at=null; render();
  }
  pendingAction=null; closeAll();
};

/* ---------- Geolocation ---------- */
$("geoBtn").onclick=()=>{
  const st=$("geoStatus");
  if(!navigator.geolocation){ st.style.color="#c0392b"; st.textContent="Tu navegador no permite ubicación. Escríbela manualmente."; return; }
  st.style.color="var(--muted)"; st.textContent="Obteniendo ubicación…";
  navigator.geolocation.getCurrentPosition(async pos=>{
    const lat=pos.coords.latitude.toFixed(6), lng=pos.coords.longitude.toFixed(6);
    geo={lat,lng};
    st.style.color="var(--pine)"; st.textContent="✅ Ubicación capturada. Completando dirección…";
    try{
      const r=await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=es`,{headers:{"Accept":"application/json"}});
      const d=await r.json(); const a=d.address||{};
      const ciudad=a.city||a.town||a.village||a.municipality||a.county||"";
      const pais=a.country||"";
      const calle=[a.road,a.house_number].filter(Boolean).join(" ");
      const barrio=a.suburb||a.neighbourhood||a.quarter||"";
      if(ciudad) $("f_ciudad").value=ciudad;
      if(pais){ const opt=[...$("f_pais").options].find(o=>o.value.toLowerCase()===pais.toLowerCase()); $("f_pais").value=opt?opt.value:"Otro"; }
      const dirVal=[calle,barrio].filter(Boolean).join(", ");
      if(dirVal) $("f_dir").value=dirVal;
      st.textContent="✅ Ubicación lista. Revísala y ajústala si hace falta.";
    }catch(e){ st.textContent="✅ Ubicación capturada (se guardará el punto en el mapa). Escribe ciudad y dirección a mano."; }
  },err=>{
    st.style.color="#c0392b";
    st.textContent = err.code===1 ? "Permiso de ubicación denegado. Escríbela manualmente." : "No se pudo obtener la ubicación. Escríbela manualmente.";
  },{enableHighAccuracy:true,timeout:10000});
};

/* ---------- Publish ---------- */
function setPostType(t){
  postType=t;
  $("pickOffer").className=t==='ofrezco'?'sel-offer':'';
  $("pickNeed").className=t==='necesito'?'sel-need':'';
  $("postTitle").textContent=t==='ofrezco'?'Ofrezco ayuda':'Necesito ayuda';
  $("lblTitulo").textContent=t==='ofrezco'?'¿Qué tienes disponible?':'¿Qué necesitas?';
  $("f_titulo").placeholder=t==='ofrezco'?'Ej: Cobijas, agua, kit de aseo':'Ej: Pañales, agua potable, medicinas';
  $("f_dir").placeholder=t==='ofrezco'?'Dirección o punto donde está / dónde entregas':'Dirección o lugar donde puedes recibirlo';
  $("dirHint").textContent=t==='ofrezco'?'Entre más exacta la dirección, más fácil coordinar la entrega.':'Indica dónde puedes recibir la ayuda.';
}
function updateRopa(){ $("ropaWrap").classList.toggle("hide", $("f_cat").value!=="ropa"); }
function genCode(){ const a="ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let s=""; for(let k=0;k<4;k++) s+=a[Math.floor(Math.random()*a.length)]; return s; }

$("submitPost").onclick=async()=>{
  const titulo=$("f_titulo").value.trim(); const ciudad=$("f_ciudad").value.trim();
  const pais=$("f_pais").value; const dir=$("f_dir").value.trim();
  const tel=$("f_tel").value.replace(/\D/g,""); const cat=$("f_cat").value;
  if(!titulo){ alert(postType==='ofrezco'?"Escribe qué tienes disponible.":"Escribe qué necesitas."); return; }
  if(!ciudad){ alert("Indica la ciudad."); return; }
  if(postType==='necesito' && !dir){ alert("Indica dónde puedes recibir la ayuda."); return; }
  if(tel.length<7){ alert("Escribe un número de WhatsApp válido."); return; }
  if(!$("f_consent").checked){ alert("Marca la casilla de aceptación para publicar."); return; }

  const code=genCode();
  const payload={
    tipo:postType, titulo, categoria:cat, ropa:cat==='ropa'?$("f_ropa").value:'',
    cantidad:$("f_cantidad").value.trim(), pais, ciudad, dir,
    lat:geo?geo.lat:'', lng:geo?geo.lng:'',
    cc:$("f_cc").value, tel, nombre:$("f_nombre").value.trim(), nota:$("f_nota").value.trim(), code
  };
  const btn=$("submitPost"); btn.disabled=true; btn.textContent="Publicando…";
  let row;
  try{ row=await rpc("publish_item",{payload}); }
  catch(e){ showErr("No se pudo publicar. Revisa tu conexión e intenta de nuevo."); btn.disabled=false; btn.textContent="Publicar"; return; }
  rememberMine(row.id, code);
  ITEMS.unshift(row);
  ["f_titulo","f_cantidad","f_ciudad","f_dir","f_tel","f_nombre","f_nota"].forEach(id=>$(id).value="");
  $("f_consent").checked=false; $("geoStatus").textContent=""; geo=null;
  btn.disabled=false; btn.textContent="Publicar"; closeAll();
  $("newCode").textContent=code; $("codeOverlay").classList.add("open");
  rebuildCities(); render();
};

/* ---------- Wiring ---------- */
function closeAll(){ document.querySelectorAll(".overlay").forEach(o=>o.classList.remove("open")); }
function initUI(){
  // brand from config
  $("eyebrow").textContent=CFG.EYEBROW||"";
  $("heroTitle").textContent=CFG.HERO_TITLE||"";
  $("heroSub").textContent=CFG.HERO_SUBTITLE||"";
  document.title=(CFG.BRAND||"Tablón")+" — "+(CFG.HERO_TITLE||"");
  // default country / cc
  $("f_pais").innerHTML=PAISES.map(p=>`<option value="${p}">${p}</option>`).join("");
  if(CFG.DEFAULT_COUNTRY) $("f_pais").value=CFG.DEFAULT_COUNTRY;
  if(CFG.DEFAULT_CC){ const o=[...$("f_cc").options].find(x=>x.value===String(CFG.DEFAULT_CC)); if(o) $("f_cc").value=String(CFG.DEFAULT_CC); }
  // categories
  $("f_cat").innerHTML=CATS.map(c=>`<option value="${c.id}">${c.emoji} ${c.label}</option>`).join("");
  $("f_cat").addEventListener("change",updateRopa);
  // chips
  const chips=$("catChips");
  chips.innerHTML=`<button class="chip active" data-cat="">Todas</button>`+CATS.map(c=>`<button class="chip" data-cat="${c.id}">${c.emoji} ${c.label}</button>`).join("");
  chips.querySelectorAll(".chip").forEach(ch=>ch.onclick=()=>{ filterCat=ch.dataset.cat; chips.querySelectorAll(".chip").forEach(x=>x.classList.remove("active")); ch.classList.add("active"); render(); });
  // type segment
  const seg=$("typeSeg");
  seg.querySelectorAll(".seg-btn").forEach(b=>b.onclick=()=>{ filterType=b.dataset.type; seg.querySelectorAll(".seg-btn").forEach(x=>x.classList.remove("active","need")); b.classList.add("active"); if(b.dataset.type==='necesito') b.classList.add("need"); render(); });
  // post type pickers
  $("pickOffer").onclick=()=>setPostType("ofrezco");
  $("pickNeed").onclick=()=>setPostType("necesito");
  // modals
  document.querySelectorAll("[data-close]").forEach(b=>b.onclick=closeAll);
  document.querySelectorAll(".overlay").forEach(o=>o.addEventListener("click",e=>{ if(e.target===o) closeAll(); }));
  document.addEventListener("keydown",e=>{ if(e.key==="Escape") closeAll(); });
  $("openPost").onclick=()=>{ setPostType("ofrezco"); $("postOverlay").classList.add("open"); };
  ["search","cityFilter","hideTaken"].forEach(id=>$(id).addEventListener("input",render));
  $("refresh").onclick=loadItems;
}

function boot(){
  initUI();
  if(!configReady()){
    $("configWarn").innerHTML='<div class="config-warn"><strong>Falta configurar Supabase.</strong> Abre <code>public/config.js</code> y pega tu <code>SUPABASE_URL</code> y <code>SUPABASE_ANON_KEY</code>. Mientras tanto, el tablón no cargará datos.</div>';
    $("board").innerHTML='<div class="empty"><h3>Configura Supabase para empezar</h3><p>Sigue el README. Toma 5 minutos.</p></div>';
    return;
  }
  sb=createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
  loadItems();
  setInterval(loadItems, CFG.POLL_MS||20000);
  document.addEventListener("visibilitychange",()=>{ if(!document.hidden) loadItems(); });
}
boot();
