import { icon } from './icons.js';
import { getCenter, requirements, route, distance } from './data.js';
export const $ = s => document.querySelector(s);
export const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
export const opt = (list, chosen, blank) => (blank !== undefined ? '<option value="">' + esc(blank) + '</option>' : '') + list.map(x => { const [v, t] = Array.isArray(x) ? x : [x, x]; return '<option value="' + esc(v) + '" ' + (v === chosen ? 'selected' : '') + '>' + esc(t) + '</option>'; }).join('');
export const btn = (label, action, style = 'outline') => '<button type="button" class="btn ' + style + '" data-do="' + action + '">' + label + '</button>';
export const field = (name, title, val = '', attrs = '') => '<label>' + title + '<input name="' + name + '" value="' + esc(val) + '" ' + attrs + '></label>';
export const select = (name, title, list, val, blank) => '<label>' + title + '<select name="' + name + '" required>' + opt(list, val, blank) + '</select></label>';
export const fact = (items) => '<dl class="facts">' + items.map(([k, v]) => '<div><dt>' + esc(k) + '</dt><dd>' + esc(v || '—') + '</dd></div>').join('') + '</dl>';
export const demoNote = '<p class="demo-note">Usa datos ficticios. Tu perfil y tus citas se guardan solo en este navegador.</p>';
export const state = { user: null, origin: null };
export const distanceLabel = (c) => state.origin ? distance(state.origin, c.coord).toFixed(1) + ' km en línea recta' : '';
export const directions = c => '<a class="text-btn" target="_blank" rel="noopener noreferrer" href="' + route(c) + '">' + icon('near', 16) + 'Cómo llegar</a>';
export const reqList = (c, s, m) => '<ul class="inline-list">' + requirements(c, s, m).map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>';
export const map = c => '<div class="minimap" style="background-position:' + Math.round((c.coord[1] + 77) * 1400) + 'px 0"><span class="marker">' + icon('pin', 20) + '</span><small>Esquema de ubicación · ' + esc(c.district) + '</small></div>';
export function siteInfo(id, s, m) { const c = getCenter(id); return '<div class="box stack">' + map(c) + '<div><p class="type-label">' + icon('center', 17) + esc(c.type) + ' de ejemplo</p><h3>' + esc(c.name) + '</h3><p>' + esc(c.address) + ' · ' + esc(c.district) + '</p><p>' + esc(s) + ' · ' + esc(m) + '</p>' + directions(c) + '<p class="micro">' + esc(distanceLabel(c)) + '</p></div><details><summary>Requisitos de esta sede</summary>' + reqList(c, s, m) + '</details></div>'; }
let restore, guard, activeHandlers = {}, closeTimer;
const dlg = $('#dialog'), content = $('#dialog-content');
export function view(title, html, handlers = {}, opts = {}) { clearTimeout(closeTimer); dlg.classList.remove('closing'); if (!dlg.open) {
    restore = document.activeElement;
    dlg.showModal();
} guard = opts.guard || null; activeHandlers = handlers; content.innerHTML = '<div class="panel-page">' + (opts.above || '') + '<h2 id="dialog-title" tabindex="-1">' + esc(title) + '</h2>' + html + '<p class="error" id="dialog-error" role="alert"></p></div>'; dlg.scrollTop = 0; $('#dialog-title').focus({ preventScroll: true }); }
export function error(msg) { const target = $('#dialog-error'); target.textContent = msg; target.scrollIntoView({ block: 'nearest' }); }
export function failure(e) { if (e?.name === 'ConstraintError')
    return 'El dato ya está registrado o el horario acaba de ocuparse. Elige otra opción.'; return 'El servicio local está temporalmente no disponible. Revisa si el navegador permite guardar datos y vuelve a intentarlo.'; }
export function close(force = false) { if (guard && !force) {
    guard();
    return;
} dlg.classList.add('closing'); closeTimer = setTimeout(() => { dlg.close(); dlg.classList.remove('closing'); guard = null; restore?.focus({ preventScroll: true }); }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 140); }
$('#dialog-close').onclick = () => close();
dlg.addEventListener('cancel', e => { e.preventDefault(); close(); });
dlg.addEventListener('click', e => { if (e.target === dlg) {
    const r = dlg.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
        close();
} });
async function handle(kind, e) { const el = e.target.closest('[data-do]'); const h = activeHandlers; if (kind === 'submit') {
    e.preventDefault();
    if (e.target.dataset.busy)
        return;
    e.target.dataset.busy = 'true';
} try {
    if (kind === 'click' && el)
        await h[el.dataset.do]?.(el, e);
    else if (kind !== 'click')
        await h[kind]?.(e);
}
catch (err) {
    error(failure(err));
}
finally {
    if (kind === 'submit')
        delete e.target.dataset.busy;
} }
for (const event of ['submit', 'click', 'change', 'input'])
    content.addEventListener(event, e => handle(event, e));
export function locate() { return new Promise((resolve, reject) => { if (!navigator.geolocation) {
    reject(new Error('unavailable'));
    return;
} navigator.geolocation.getCurrentPosition(p => resolve([p.coords.latitude, p.coords.longitude]), reject, { timeout: 8000, maximumAge: 120000 }); }); }
export const formData = f => Object.fromEntries(new FormData(f));
export function statusTag(status) { return '<span class="status ' + ({ Confirmada: 'ok', Pendiente: 'pending', Cancelada: 'cancel' }[status] || '') + '">' + esc(status) + '</span>'; }
