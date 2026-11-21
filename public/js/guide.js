import { facilities } from './facilities.js';
import { insuranceOptions, coverageGuide } from './coverage.js';
import { $, btn, esc, field, select, view, formData, state, locate } from './ui.js';

export const findSite = id => facilities.find(c => c.id === id);
export const external = (url, label, style = 'text-btn') => '<a class="' + style + '" target="_blank" rel="noopener noreferrer" href="' + esc(url) + '">' + esc(label) + '</a>';
export function mapsUrl(c, origin = '') {
    const url = new URL('https://www.google.com/maps/dir/');
    url.searchParams.set('api', '1');
    url.searchParams.set('destination', [c.name, c.address, c.district, 'Lima, Perú'].join(', '));
    if (origin) url.searchParams.set('origin', String(origin));
    return url.href;
}
export function routing(c) {
    view('Cómo llegar', '<p class="sub">' + esc(c.name) + ' · ' + esc(c.address) + ', ' + esc(c.district) + '</p><div class="stack"><button type="button" class="btn primary" data-do="geo">Calcular desde mi ubicación</button><p role="status" id="route-status"></p><form class="stack">' + field('origin','O escribe tu punto de partida','','required maxlength="180" autocomplete="off" placeholder="Dirección o distrito"') + '<button class="btn outline">Preparar ruta</button></form><div id="route-result">' + external(mapsUrl(c), 'Elegir el origen en Google Maps') + '</div></div>', {
        geo: async el => {
            const status = $('#route-status');
            el.disabled = true; status.textContent = 'Buscando tu ubicación…';
            try {
                state.origin = await locate();
                if (status.isConnected) show(state.origin);
            } catch {
                status.textContent = 'Puedes escribir el origen o elegirlo en Google Maps.';
            } finally { el.disabled = false; }
        },
        submit: e => show(formData(e.target).origin.trim())
    });
    function show(origin) {
        if (!origin) return;
        $('#route-status').textContent = 'Ruta preparada. Google Maps calculará el recorrido.';
        $('#route-result').innerHTML = external(mapsUrl(c, origin), 'Ver recorrido en Google Maps', 'btn primary');
        $('#route-result a').focus();
    }
}
function sources(c) {
    const urls = [...new Set([c.source, ...(c.sources || [])].map(s => typeof s === 'string' ? s : s?.url).filter(Boolean))];
    return '<div class="detail-links">' + urls.map((url,i) => external(url, i ? 'Fuente complementaria ' + i : 'Fuente oficial de la sede')).join('') + '</div>';
}
export function siteDetails(c) {
    return '<div class="box stack"><div><p class="type-label">' + esc(c.district) + '</p><h3>' + esc(c.name) + '</h3><p>' + esc(c.address) + '</p></div><div><strong>Horario publicado</strong><p>' + esc(c.hours) + '</p></div><div><strong>Cómo solicitar atención</strong><p>' + esc(c.booking) + '</p></div>' + (c.phone ? '<p>Teléfono · ' + esc(c.phone) + '</p>' : '') + (c.notes ? '<p>' + esc(c.notes) + '</p>' : '') + sources(c) + '</div>';
}
export function guide(kind, initial = {}, save) {
    const book = kind === 'book';
    const c = findSite(initial.center);
    const service = c?.services.includes(initial.service) ? initial.service : '';
    const mode = initial.mode || '';
    view(book ? 'Pedir una cita médica' : 'Ver requisitos', '<p class="sub">' + (book ? 'Elige dónde y por qué servicio te atenderás. La sede confirma los cupos y la fecha.' : 'Elige tu cobertura para revisar los pasos. Puedes añadir una sede y el servicio que necesitas.') + '</p><form class="stack"><div class="form-grid">' + select('center', 'Establecimiento', facilities.map(s => [s.id,s.name]),c?.id,'Elige una sede') + '<label>Servicio<select name="service"></select></label>' + select('mode','Cobertura o forma de pago',insuranceOptions,mode,'Elige una opción') + '</div><div id="guide-info" class="stack" aria-live="polite"></div></form>', {
        change(e) { refresh(e.target.name === 'center'); },
        speak() {
            const g = coverageGuide[form.elements.mode.value];
            if (!g) return;
            speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance([g.text,...g.steps].join('. '));
            u.lang='es-PE'; speechSynthesis.speak(u);
        },
        route() { routing(findSite($('[name=center]').value)); },
        save() { const f = formData($('#dialog form')); save(f); }
    });
    const form = $('#dialog form');
    if (!book) form.elements.center.required = false;
    function refresh(resetService) {
        const site = findSite(form.elements.center.value);
        const services = form.elements.service;
        const current = resetService ? '' : services.value || service;
        services.innerHTML = '<option value="">Elige un servicio</option>' + (site?.services || []).map(s => '<option ' + (s === current ? 'selected' : '') + '>' + esc(s) + '</option>').join('');
        services.disabled = !site;
        const selected = form.elements.mode.value;
        const g = coverageGuide[selected];
        let html = '';
        if (g) html += '<div><h3>' + esc(selected) + '</h3><p>' + esc(g.text) + '</p><ul class="inline-list">' + g.steps.map(s=>'<li>'+esc(s)+'</li>').join('') + '</ul>' + external(g.url,'Consultar guía oficial de cobertura') + '</div>';
        if (site) {
            html += siteDetails(site);
            const hours = site.serviceHours?.[services.value];
            if (hours) html += '<p class="notice"><strong>Horario de ' + esc(services.value) + '</strong><br>' + esc(hours) + '</p>';
        }
        if (!book && g && 'speechSynthesis' in window) html += btn('Escuchar los requisitos','speak');
        if (site && selected && !site.modes.includes(selected)) html += '<p class="notice">Esta sede no publica un convenio para la cobertura elegida. Verifícalo con admisión y con tu aseguradora.</p>';
        if (site && book && services.value) html += '<p class="notice">Para ' + esc(services.value) + ', confirma el turno por el canal de la sede antes de acudir.</p><div class="actions">' + external(site.bookingUrl || site.source, 'Consultar canal oficial', 'btn primary') + btn('Cómo llegar','route') + (selected ? btn('Ya tengo cita · guardar mi visita','save') : '') + '</div>';
        else if (site) html += '<div class="actions">' + btn('Cómo llegar','route') + '</div>';
        $('#guide-info').innerHTML = html;
    }
    form.onsubmit = e => e.preventDefault();
    refresh(false);
}
