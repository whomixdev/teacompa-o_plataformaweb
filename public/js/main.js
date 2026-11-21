import { fillIcons, icon } from './icons.js';
import { centers, services, modes, searchCenters, distance, getCenter } from './data.js';
import { initSession, account } from './account.js';
import { startBooking, requirementsDialog } from './booking.js';
import { consultation } from './consult.js';
import { saveReport } from './storage.js';
import { $, opt, esc, view, formData, btn, select, state, directions, distanceLabel, locate, failure, close } from './ui.js';
fillIcons();
const initialized = initSession().then(() => true).catch(() => false);
async function local(action) { if (await initialized)
    return action(); view('Servicio temporalmente no disponible', '<p>Este navegador no permitió abrir los datos locales. Habilita el almacenamiento del sitio y vuelve a intentar.</p><div class="actions">' + btn('Volver a intentar', 'retry') + '</div>', { retry: () => location.reload() }); }
const consult = (dni = '') => local(() => consultation(dni));
const book = (initial = {}) => local(() => startBooking(initial, consult));
const req = initial => requirementsDialog(initial, book);
const dir = $('#directory');
const query = $('#center-q');
const byType = $('#filter-type');
const byService = $('#filter-service');
const byMode = $('#filter-mode');
byType.innerHTML = opt([...new Set(centers.map(c => c.type))], '', 'Todos los tipos');
byService.innerHTML = opt(services, '', 'Todos los servicios');
byMode.innerHTML = opt(modes, '', 'Todas');
function directory() { const hits = searchCenters({ query: query.value, type: byType.value, service: byService.value, mode: byMode.value }); if (state.origin)
    hits.sort((a, b) => distance(state.origin, a.coord) - distance(state.origin, b.coord)); $('#count').textContent = hits.length + ' ' + (hits.length === 1 ? 'establecimiento' : 'establecimientos') + (state.origin ? ' · Por cercanía' : ''); dir.innerHTML = hits.length ? hits.map(c => '<article class="center-card"><span class="type-label">' + icon('center', 18) + esc(c.type) + '</span><h3>' + esc(c.name) + '</h3><p>' + esc(c.district) + '</p><p class="meta">' + esc(c.address) + ' · Sede ficticia</p><div class="tags">' + [...new Set(Object.values(c.offer).flat())].map(m => '<span class="tag">' + m + '</span>').join('') + '</div><p class="meta">' + esc(Object.keys(c.offer).join(' · ')) + '</p>' + (state.origin ? '<p>' + distanceLabel(c) + '</p>' : '') + '<div class="detail-links">' + directions(c) + '<button class="text-btn" data-action="requirements" data-center="' + c.id + '">Ver requisitos</button></div><button class="btn outline" data-action="book" data-center="' + c.id + '">Pedir cita aquí</button></article>').join('') : '<div class="empty"><h3>No encontramos sedes con esos filtros.</h3><p>Quita los filtros para explorar todos los distritos del directorio.</p><button class="text-btn" data-action="reset">Ver todas las sedes</button></div>'; }
function reset() { query.value = ''; byType.value = ''; byMode.value = ''; byService.value = ''; $('#hero-q').value = ''; directory(); }
function showDirectory() { location.hash = 'centros'; $('#centros').scrollIntoView({ block: 'start' }); }
for (const el of [query, byType, byService, byMode])
    el.addEventListener(el === query ? 'input' : 'change', directory);
$('#clear').onclick = reset;
$('#hero-search').onsubmit = e => { e.preventDefault(); const q = $('#hero-q').value; reset(); query.value = q; $('#hero-q').value = q; directory(); showDirectory(); };
directory();
async function nearby() { const msg = $('#geo-msg'); msg.textContent = 'Buscando tu ubicación…'; try {
    state.origin = await locate();
    reset();
    msg.textContent = 'Sedes ordenadas por distancia en línea recta.';
    showDirectory();
}
catch {
    msg.textContent = 'Ubicación no disponible. Escribe tu distrito para encontrar una sede.';
    $('#hero-q').focus();
} }
function report() { view('Reportar un dato', '<p class="sub">Registra una corrección de demostración. Se conserva en este navegador.</p><form class="stack">' + select('center', 'Establecimiento', centers.map(c => [c.id, c.name]), '', 'Elige una sede') + '<label>Dato que deseas corregir<textarea name="detail" rows="3" required minlength="6" maxlength="500"></textarea></label><button class="btn primary">Guardar reporte local</button></form>', { submit: async (e) => { const f = formData(e.target); await saveReport(f.center, f.detail); view('Reporte guardado', '<p>Tu corrección sobre ' + esc(getCenter(f.center).name) + ' quedó registrada en este navegador.</p><div class="actions">' + btn('Cerrar', 'end') + '</div>', { end: () => close(true) }); } }); }
document.addEventListener('click', async (e) => { const b = e.target.closest('[data-action]'); if (!b)
    return; const c = getCenter(b.dataset.center); const initial = c ? { center: c.id, service: byService.value || Object.keys(c.offer).find(s => !byMode.value || c.offer[s].includes(byMode.value)), mode: byMode.value } : {}; if (c && !initial.mode)
    initial.mode = c.offer[initial.service][0]; try {
    switch (b.dataset.action) {
        case 'book':
            await book(initial);
            break;
        case 'consult':
            await (b.id === 'foot-account' ? local(() => account(consult)) : consult());
            break;
        case 'requirements':
            req(initial);
            break;
        case 'locate':
            await nearby();
            break;
        case 'reset':
            reset();
            break;
        case 'report':
            await local(report);
            break;
    }
}
catch (e) {
    view('Servicio temporalmente no disponible', '<p>' + failure(e) + '</p><div class="actions">' + btn('Cerrar', 'end') + '</div>', { end: () => close(true) });
} });
const nav = $('#nav'), menu = $('#menu');
function toggle(open) { nav.classList.toggle('open', open); menu.setAttribute('aria-expanded', open); menu.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú'); menu.innerHTML = icon(open ? 'close' : 'menu'); }
menu.onclick = () => toggle(!nav.classList.contains('open'));
nav.onclick = () => toggle(false);
document.addEventListener('click', e => { if (!e.target.closest('header') && nav.classList.contains('open'))
    toggle(false); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('open')) {
    toggle(false);
    menu.focus();
} });
const links = [...nav.querySelectorAll('a')];
function active() { let current = links[0]; for (const a of links)
    if ($(a.hash).getBoundingClientRect().top <= 140)
        current = a; if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4)
    current = links.at(-1); for (const a of links) {
    a.classList.toggle('current', a === current);
    if (a === current)
        a.setAttribute('aria-current', 'location');
    else
        a.removeAttribute('aria-current');
} }
let tick = false;
addEventListener('scroll', () => { if (!tick)
    requestAnimationFrame(() => { tick = false; active(); }); tick = true; }, { passive: true });
active();
const mobile = matchMedia('(max-width:760px)');
const quick = $('.quick'), hero = $('.hero'), pic = $('.hero-visual');
function moveQuick() { if (mobile.matches) {
    pic.before(quick);
    quick.classList.add('in-hero');
}
else {
    hero.after(quick);
    quick.classList.remove('in-hero');
} }
mobile.addEventListener('change', moveQuick);
moveQuick();
