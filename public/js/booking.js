import { centers, services, modes, getCenter, searchCenters, schedule, showSlot, distance } from './data.js';
import * as db from './storage.js';
import { access } from './account.js';
import { icon } from './icons.js';
import { view, btn, field, select, formData, error, state, esc, demoNote, fact, reqList, siteInfo, locate, distanceLabel, statusTag, close } from './ui.js';
const relations = ['Hijo/a', 'Pareja', 'Padre/madre', 'Hermano/a', 'Nieto/a', 'Cuidador/a', 'Otra relación'];
const labels = ['Atención', 'Sede y horario', 'Datos del paciente', 'Revisar y enviar'];
const stepBar = n => '<div class="steps" aria-hidden="true">' + labels.map((_, i) => '<i class="' + (i < n ? 'on' : '') + '"></i>').join('') + '</div><div class="step-label">Paso ' + n + ' de 4 · Solicitar cita</div>';
const supports = (c, s, m) => c?.offer[s]?.includes(m);
const openSlots = (c, s, m, busy) => schedule(c, s, m).filter(slot => !busy.has(db.slotKey({ center: c.id, service: s, slot })));
const optionsCenter = cs => cs.map(c => [c.id, c.name]);
export function requirementsDialog(init, book) { const d = { ...init }; function render() { const c = getCenter(d.center) || centers[0]; d.center = c.id; if (!c.offer[d.service])
    d.service = Object.keys(c.offer)[0]; if (!supports(c, d.service, d.mode))
    d.mode = c.offer[d.service][0]; view('Ver requisitos', '<p class="sub">Prepara tu visita con los requisitos de la sede de ejemplo.</p><form class="stack">' + select('center', 'Establecimiento', optionsCenter(centers), d.center) + '<div class="form-grid">' + select('service', 'Servicio', Object.keys(c.offer), d.service) + select('mode', 'Modalidad', c.offer[d.service], d.mode) + '</div><div class="box"><h3>Qué llevar y dónde presentarte</h3>' + reqList(c, d.service, d.mode) + '</div><button class="btn primary">Pedir cita con estos datos</button></form>', { change: e => { d[e.target.name] = e.target.value; render(); document.querySelector('[name="' + e.target.name + '"]')?.focus(); }, submit: () => book(d) }); } render(); }
export async function startBooking(initial = {}, onConsult) {
    const c = getCenter(initial.center);
    const p = state.user;
    const d = { service: initial.service || Object.keys(c?.offer || {})[0] || services[0], mode: initial.mode || '', insurance: p?.insurance || 'No lo sé', center: c?.id || '', district: c?.district || '', slot: '', who: 'self', patient: p?.name || '', dni: p?.dni || '', requester: '', relation: relations[0], requesterContact: '', withCompanion: 'No', companion: '', same: false, recipient: 'Paciente', channel: 'Correo', contact: p?.email || '' };
    if (c)
        d.mode = initial.mode || c.offer[d.service][0];
    let step = initial.service && c ? 2 : 1, dirty = false, busy = await db.occupied(), geoMessage = '', comparing = false, manual = false, submitting = false;
    const guard = () => { if (!dirty) {
        close(true);
        return;
    } view('¿Salir de la solicitud?', '<p>Si sales, se perderán los datos de esta solicitud sin enviar.</p><div class="actions">' + btn('Seguir completando', 'stay', 'primary') + btn('Salir sin guardar', 'leave') + '</div>', { stay: render, leave: () => close(true) }, { guard: render }); };
    const pull = () => { const f = document.querySelector('#booking'); if (f)
        Object.assign(d, formData(f)); if (f?.elements.same)
        d.same = f.elements.same.checked; };
    const baseHandlers = { input: () => { dirty = true; }, back: () => { pull(); step--; render(); }, edit: el => { step = Number(el.dataset.step); render(); } };
    const buttons = (next = 'Continuar') => '<div class="actions">' + (step > 1 ? btn('Atrás', 'back') : '') + '<button class="btn primary">' + next + '</button></div>';
    function page(body, handlers) { view(labels[step - 1], '<form id="booking" class="stack">' + body + '</form>', { ...baseHandlers, ...handlers }, { above: stepBar(step), guard }); }
    function next() { dirty = true; step++; render(); }
    function render() {
        if (step === 1) {
            page(select('service', 'Servicio que necesitas', services, d.service) + select('insurance', '¿Qué seguro tiene el paciente?', ['SIS', 'Otro seguro', 'Sin seguro', 'No lo sé'], d.insurance) + select('mode', '¿Cómo se atenderá en esta cita?', modes, d.mode, 'Selecciona una modalidad') + buttons(), { submit: () => { pull(); if (!supports(getCenter(d.center), d.service, d.mode)) {
                    d.center = '';
                    d.district = '';
                    d.slot = '';
                } next(); } });
            return;
        }
        if (step === 2) {
            const eligible = searchCenters({ service: d.service, mode: d.mode });
            if (!eligible.length) {
                page('<p class="notice">No hay sedes para esta combinación.</p>' + btn('Cambiar atención', 'back'), {});
                return;
            }
            const districts = [...new Set(eligible.map(c => c.district))];
            if (!districts.includes(d.district))
                d.district = districts[0];
            const districtSites = eligible.filter(c => c.district === d.district);
            let place = districtSites.find(c => c.id === d.center) || districtSites[0];
            d.center = place.id;
            const slots = openSlots(place, d.service, d.mode, busy);
            if (!slots.includes(d.slot))
                d.slot = '';
            let compare = '';
            if (comparing) {
                const list = eligible.filter(c => c.id !== place.id).sort((a, b) => state.origin ? distance(state.origin, a.coord) - distance(state.origin, b.coord) : 0);
                compare = '<div class="box stack"><h3>Comparar sedes cercanas</h3>' + list.map(c => { const first = openSlots(c, d.service, d.mode, busy)[0]; return '<button type="button" class="list-button" data-do="choose" data-id="' + c.id + '"><span><strong>' + esc(c.name) + '</strong><small>' + esc(c.type + ' · ' + c.district) + '</small><small>' + esc(d.service + ' · ' + d.mode + ' · ' + (first ? showSlot(first) : 'Sin cupos')) + '</small><small>' + esc(distanceLabel(c)) + '</small></span>' + icon('pin', 18) + '</button>'; }).join('') + (list.length ? '' : '<p>Esta es la única sede que coincide.</p>') + '</div>';
            }
            page('<div class="form-grid">' + select('district', 'Distrito', districts, d.district) + select('center', 'Establecimiento', optionsCenter(districtSites), place.id) + '</div>' + siteInfo(place.id, d.service, d.mode) + '<div class="detail-links">' + btn('Calcular desde mi ubicación', 'gps') + btn('Ingresar mi punto de partida', 'manual') + '</div>' + (manual ? select('origin', 'Distrito de partida (referencia)', centers.map(c => [c.id, c.district]), '', 'Selecciona tu distrito') : '') + (geoMessage ? '<p class="micro" role="status">' + esc(geoMessage) + '</p>' : '') + btn(comparing ? 'Cerrar comparación' : 'Comparar sedes cercanas', 'compare') + compare + (slots.length ? select('slot', 'Fecha y hora disponibles · Lima', slots.map(s => [s, showSlot(s)]), d.slot, 'Elige un horario') : '<p class="notice">Sin cupos de demostración para esta atención. Compara otras sedes o cambia la modalidad.</p>') + (slots.length ? buttons() : btn('Atrás', 'back')), { change: e => { dirty = true; const n = e.target.name; if (n === 'origin') {
                    const o = getCenter(e.target.value);
                    if (o) {
                        state.origin = o.coord;
                        geoMessage = 'Distancia desde un punto de referencia de ' + o.district;
                        manual = false;
                    }
                    render();
                    return;
                } pull(); if (n === 'district') {
                    d.center = '';
                    d.slot = '';
                } if (n === 'center')
                    d.slot = ''; if (n !== 'slot') {
                    render();
                    document.querySelector('[name="' + n + '"]')?.focus();
                } }, gps: async () => { pull(); const f = document.querySelector('#booking'); try {
                    state.origin = await locate();
                    geoMessage = 'Ubicación disponible. La distancia se calcula en línea recta.';
                }
                catch {
                    geoMessage = 'Ubicación no disponible. Puedes elegir un distrito de partida o continuar.';
                } if (f === document.querySelector('#booking'))
                    render(); }, manual: () => { pull(); manual = !manual; render(); }, compare: () => { pull(); comparing = !comparing; render(); }, choose: el => { const c = getCenter(el.dataset.id); d.center = c.id; d.district = c.district; d.slot = ''; comparing = false; dirty = true; render(); }, submit: () => { pull(); if (!slots.includes(d.slot))
                    return error('Elige un horario disponible.'); next(); } });
            return;
        }
        if (step === 3) {
            const other = d.who === 'other';
            if (!other)
                d.recipient = 'Paciente';
            page(demoNote + select('who', '¿Para quién es la cita?', [['self', 'La cita es para mí'], ['other', 'Estoy pidiendo cita para otra persona']], d.who) + '<div class="form-grid">' + field('patient', 'Nombre del paciente', d.patient, 'required minlength="3" maxlength="90"') + field('dni', 'DNI del paciente (de prueba)', d.dni, 'required inputmode="numeric" pattern="[0-9]{8}" maxlength="8" title="Ingresa ocho dígitos"') + '</div>' + (other ? '<div class="box stack"><h3>Datos del solicitante</h3>' + field('requester', 'Nombre del solicitante', d.requester, 'required minlength="3" maxlength="90"') + select('relation', 'Relación con el paciente', relations, d.relation) + field('requesterContact', 'Contacto del solicitante (correo o celular)', d.requesterContact, 'required maxlength="100"') + '</div>' : '') + select('withCompanion', '¿Habrá acompañante?', ['No', 'Sí'], d.withCompanion) + (d.withCompanion === 'Sí' ? (other ? '<label class="check-label"><input type="checkbox" name="same" ' + (d.same ? 'checked' : '') + '>El solicitante también acompañará al paciente</label>' : '') + (!(d.same && other) ? field('companion', 'Nombre del acompañante', d.companion, 'required minlength="3" maxlength="90"') : '') : '') + '<div class="form-grid">' + select('recipient', 'Destinatario del aviso', other ? ['Paciente', 'Solicitante'] : ['Paciente'], d.recipient) + select('channel', 'Canal del aviso', ['Correo', 'WhatsApp'], d.channel) + '</div>' + field('contact', d.channel === 'Correo' ? 'Correo de ejemplo del destinatario' : 'WhatsApp de ejemplo del destinatario', d.contact, d.channel === 'Correo' ? 'required type="email" maxlength="100"' : 'required type="tel" pattern="[+0-9 ]{9,18}"') + '<p class="micro">El aviso se simula en pantalla.</p>' + buttons(), { change: e => { const n = e.target.name; if (!['who', 'withCompanion', 'same', 'recipient', 'channel'].includes(n))
                    return; pull(); dirty = true; if (n === 'who') {
                    d.patient = other ? (p?.name || '') : '';
                    d.dni = other ? (p?.dni || '') : '';
                    d.requester = p?.name || '';
                    d.same = false;
                } if (n === 'channel' || n === 'recipient')
                    d.contact = d.recipient === 'Solicitante' ? d.requesterContact : d.who === 'self' ? (d.channel === 'Correo' ? p?.email : p?.phone) || '' : ''; render(); document.querySelector('[name="' + n + '"]')?.focus(); }, submit: () => { pull(); if (other && !/^(?:[^\s@]+@[^\s@]+\.[^\s@]+|\+?[\d ]{9,18})$/.test(d.requesterContact.trim()))
                    return error('Revisa el correo o celular del solicitante.'); next(); } });
            return;
        }
        const place = getCenter(d.center);
        const companion = d.withCompanion === 'Sí' ? (d.who === 'other' && d.same ? d.requester : d.companion) : 'Sin acompañante';
        const block = (title, n, items) => '<div class="box"><div class="split"><h3>' + title + '</h3><button type="button" class="text-btn" data-do="edit" data-step="' + n + '">Editar ' + title.toLowerCase() + '</button></div>' + fact(items) + '</div>';
        page(block('Atención', 1, [['Servicio', d.service], ['Seguro del paciente', d.insurance], ['Modalidad', d.mode]]) + block('Sede y horario', 2, [['Establecimiento', place.name], ['Dirección', place.address + ', ' + place.district], ['Fecha y hora', showSlot(d.slot)]]) + block('Paciente y aviso', 3, [['Paciente', d.patient], ['DNI', d.dni], ['Solicitante', d.who === 'self' ? d.patient : d.requester], ['Relación', d.who === 'self' ? 'Paciente' : d.relation], ['Acompañante', companion], ['Destinatario', d.recipient + ' · ' + d.channel], ['Contacto', d.contact]]) + '<p class="demo-note">Esta solicitud se guardará como ejemplo en tu cuenta local.</p>' + buttons('Enviar solicitud de demostración'), { submit: () => access(async (user) => { if (submitting)
                return; submitting = true; const a = { ...d, id: 'TA-' + crypto.randomUUID().slice(0, 8).toUpperCase(), owner: user.emailKey, requester: d.who === 'self' ? d.patient : d.requester, relation: d.who === 'self' ? 'Paciente' : d.relation, companion, status: place.confirmed ? 'Confirmada' : 'Pendiente', room: '02' }; try {
                await db.reserve(a);
            }
            catch (e) {
                submitting = false;
                if (e.name === 'ConstraintError') {
                    busy = await db.occupied();
                    d.slot = '';
                    step = 2;
                    render();
                    error('Ese horario acaba de ocuparse. Elige otro.');
                    return;
                }
                throw e;
            } dirty = false; view(a.status === 'Confirmada' ? 'Cita confirmada' : 'Solicitud recibida', '<div class="success-icon">' + icon('tick', 32) + '</div>' + statusTag(a.status) + '<p>' + esc(a.patient) + ' · ' + esc(a.service) + '</p><p>' + esc(showSlot(a.slot)) + '</p><p>Código <strong>' + a.id + '</strong></p><p class="demo-note">Registro de demostración. El aviso a ' + esc(d.recipient.toLowerCase()) + ' se ha simulado en pantalla.</p><div class="actions">' + btn('Consultar mi cita', 'consult', 'primary') + btn('Cerrar', 'end') + '</div>', { consult: () => onConsult(a.dni), end: () => close(true) }); }) });
    }
    render();
}
