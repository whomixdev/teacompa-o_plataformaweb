import { fillIcons, icon } from './icons.js';
import { facilities } from './facilities.js';
import { norm } from './data.js';
import { initSession, account } from './account.js';
import { guide, routing, findSite, external } from './guide.js';
import { visits, saveAppointment } from './visits.js';
import { report } from './report.js';
import { $, opt, esc, view, state } from './ui.js';

fillIcons();
const ready=initSession().then(()=>true,()=>false);
const directory=$('#directory'), section=$('#centros'), query=$('#center-q'), home=$('#hero-q'), suggestions=$('#suggestions');
const filters={type:$('#filter-type'),services:$('#filter-service'),modes:$('#filter-mode')};
for(const [key,el] of Object.entries(filters)) {
    const values=[...new Set(facilities.flatMap(c=>c[key]))].sort((a,b)=>a.localeCompare(b,'es'));
    el.innerHTML=opt(values,'',key==='type'?'Todos los tipos':key==='services'?'Todos los servicios':'Todas las coberturas');
    el.addEventListener('change',renderDirectory);
}
const matches=(c,value)=>norm(c.name+' '+c.district+' '+c.type).includes(norm(value));
function renderDirectory() {
    const hits=facilities.filter(c=>matches(c,query.value) && (!filters.type.value || c.type===filters.type.value) && (!filters.services.value || c.services.includes(filters.services.value)) && (!filters.modes.value || c.modes.includes(filters.modes.value)));
    $('#count').textContent=hits.length+' '+(hits.length===1?'establecimiento':'establecimientos');
    directory.innerHTML=hits.map(c=>'<article class="center-card"><span class="type-label">'+icon('center',18)+esc(c.type)+'</span><h3>'+esc(c.name)+'</h3><p>'+esc(c.district)+'</p><p class="meta">'+esc(c.address)+'</p><div class="tags">'+c.modes.map(m=>'<span class="tag">'+esc(m)+'</span>').join('')+'</div><p class="meta">'+esc(c.services.join(' · '))+'</p><details><summary>Horarios y fuente</summary><p>'+esc(c.hours)+'</p>'+external(c.source,'Consultar fuente oficial')+'</details><div class="detail-links"><button class="text-btn" data-action="route" data-center="'+esc(c.id)+'">Cómo llegar</button><button class="text-btn" data-action="requirements" data-center="'+esc(c.id)+'">Ver requisitos</button></div><button class="btn outline" data-action="book" data-center="'+esc(c.id)+'">Pedir cita aquí</button></article>').join('') || '<div class="empty"><h3>Sin coincidencias</h3><p>Prueba otro nombre o cambia los filtros.</p><button class="text-btn" data-action="reset">Ver todas las sedes</button></div>';
}
function hideSuggestions(){clearTimeout(timer);suggestions.replaceChildren();suggestions.hidden=true;}
function openDirectory(scroll=true) {
    section.hidden=false;renderDirectory();
    if(scroll) {section.scrollIntoView({block:'start'});section.focus({preventScroll:true});}
}
function reset() {query.value='';Object.values(filters).forEach(x=>x.value='');home.value='';homeInput();renderDirectory();}
function search(value) {
    hideSuggestions();reset();home.value=value;query.value=value;$('#hero-search button').disabled=false;
    $('#search-status').textContent='Resultados de «'+value+'».';
    if(location.hash!=='#centros') location.hash='centros';
    openDirectory();
}
let timer;
function homeInput() {
    hideSuggestions();
    const v=home.value.trim(), status=$('#search-status');
    $('#hero-search button').disabled=!v;
    if(!v) {status.textContent='Escribe el nombre del centro o su distrito.';return;}
    status.innerHTML='<span class="spinner" aria-hidden="true"></span> Buscando…';
    timer=setTimeout(()=>{
        const all=facilities.filter(c=>matches(c,v)),hits=all.slice(0,5);
        status.textContent=all.length?all.length+' coincidencias. Elige una sede o pulsa Buscar.':'Sin coincidencias. Prueba con otro nombre o distrito.';
        suggestions.innerHTML=hits.map(c=>'<button type="button" data-suggestion="'+esc(c.id)+'"><strong>'+esc(c.name)+'</strong><small>'+esc(c.district)+'</small></button>').join('');
        suggestions.hidden=!hits.length;
    },130);
}
home.addEventListener('input',homeInput);
$('#hero-search').onsubmit=e=>{e.preventDefault();const v=home.value.trim();if(v) search(v);else homeInput();};
suggestions.onclick=e=>{const b=e.target.closest('[data-suggestion]');if(b) search(findSite(b.dataset.suggestion).name);};
$('#hero-search').onkeydown=e=>{
    const buttons=[...suggestions.querySelectorAll('button')];
    if(e.key==='Escape') {hideSuggestions();home.focus();return;}
    if(!buttons.length || !['ArrowDown','ArrowUp'].includes(e.key)) return;
    e.preventDefault();const next=buttons.indexOf(document.activeElement)+(e.key==='ArrowDown'?1:-1);
    (buttons[next] || home).focus();
};
query.addEventListener('input',renderDirectory);$('#clear').onclick=reset;
async function nearby() {
    view('Calcular desde mi ubicación','<p>Elige el establecimiento de destino. Podrás usar tu ubicación actual o escribir desde dónde sales.</p><div class="stack"><label>Establecimiento<select id="route-site">'+opt(facilities.map(c=>[c.id,c.name]),'','Elige una sede')+'</select></label><button id="choose-route" class="btn primary" data-do="next" disabled>Preparar ruta</button></div>',{change:()=>$('#choose-route').disabled=!$('#route-site').value,next:()=>routing(findSite($('#route-site').value))});
}
const nav=$('#nav'),menu=$('#menu');
function toggle(open){nav.classList.toggle('open',open);menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú');menu.innerHTML=icon(open?'close':'menu');}
menu.onclick=()=>toggle(!nav.classList.contains('open'));
matchMedia('(max-width:1190px)').addEventListener('change',()=>toggle(false));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open')){toggle(false);menu.focus();}});
nav.addEventListener('focusout',e=>{if(e.relatedTarget && !nav.contains(e.relatedTarget) && e.relatedTarget!==menu)toggle(false);});
const local=async fn=>await ready?fn():view('Almacenamiento local inaccesible','<p>Permite que este navegador guarde datos del sitio para usar tu cuenta. El directorio y las guías siguen disponibles.</p>');
document.addEventListener('click',async e=>{
    const el=e.target.closest('[data-action],a[href^="#"]');
    if(!e.target.closest('#hero-search')) hideSuggestions();
    if(e.target!==menu && !menu.contains(e.target)) toggle(false);
    if(!el) return;
    if(el.getAttribute('href')==='#centros'){e.preventDefault();if(location.hash!=='#centros')location.hash='centros';openDirectory();return;}
    const c=findSite(el.dataset.center), f=c?{center:c.id,service:filters.services.value,mode:filters.modes.value}:{};
    const save=f=>local(()=>saveAppointment(f));
    switch(el.dataset.action){
        case 'account': return local(()=>account(visits));
        case 'consult': return local(visits);
        case 'requirements': return guide('requirements',f,save);
        case 'book': return guide('book',f,save);
        case 'route': return routing(c);
        case 'locate': return nearby();
        case 'report': return report();
        case 'reset': return reset();
    }
});
function hash(){if(location.hash==='#centros')openDirectory();}
addEventListener('hashchange',hash);hash();
const navLinks=[...nav.querySelectorAll('a')];
let ticking=false;
function active() {
    const current=navLinks.filter(a=>{const s=$(a.hash);return !s.hidden && s.getBoundingClientRect().top<=145;}).at(-1) || navLinks[0];
    navLinks.forEach(a=>{a.classList.toggle('current',a===current);if(a===current)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
    ticking=false;
}
addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(active);}},{passive:true});active();
const mobile=matchMedia('(max-width:760px)'),quick=$('.quick'),hero=$('.hero'),pic=$('.hero-visual');
function moveQuick(){if(mobile.matches)pic.before(quick);else hero.after(quick);quick.classList.toggle('in-hero',mobile.matches);}
mobile.addEventListener('change',moveQuick);moveQuick();
ready.then(ok=>{
    if(!ok || !state.user) return;
    const raw=sessionStorage.getItem('te-acompano:volver');
    if(!raw)return;
    sessionStorage.removeItem('te-acompano:volver');
    const next=JSON.parse(raw);
    if(next.action==='save' && findSite(next.selection?.center)) saveAppointment(next.selection);
    else if(next.action==='account') account(visits);
    else visits();
});
