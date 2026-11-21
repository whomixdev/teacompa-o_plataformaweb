export const services = ['Medicina general', 'Geriatría', 'Odontología', 'Enfermería'];
export const modes = ['SIS', 'Particular'];
export const demo = { email: 'UsuarioPrueba@gmail.com', name: 'Juan Carlos Gonzales', dni: '00000000', phone: '+51 987654321', address: 'Av. San Juan de Miraflores, Ciudad, Lima', family: 'Juana Rosa Gonzales', insurance: 'SIS', site: 'sjm' };
export const demoKey = 'TeAcompanoDemo26';
export const centers = [
    { id: 'sjm', name: 'Centro de Salud de Prueba', district: 'San Juan de Miraflores', type: 'Centro de salud', address: 'Av. Los Jardines 120', coord: [-12.159, -76.972], offer: { 'Medicina general': modes, 'Enfermería': modes, 'Odontología': ['Particular'] }, confirmed: true },
    { id: 'surco', name: 'Policlínico Los Álamos', district: 'Santiago de Surco', type: 'Policlínico', address: 'Calle Los Álamos 245', coord: [-12.146, -76.992], offer: { 'Medicina general': modes, 'Geriatría': modes, 'Odontología': ['Particular'] }, confirmed: false },
    { id: 'ves', name: 'Posta Los Olivos del Sur', district: 'Villa El Salvador', type: 'Posta', address: 'Calle Las Palmeras 180', coord: [-12.213, -76.939], offer: { 'Medicina general': ['SIS'], 'Enfermería': ['SIS'] }, full: true, confirmed: false },
    { id: 'vmt', name: 'Hospital Jardines del Sur', district: 'Villa María del Triunfo', type: 'Hospital', address: 'Av. Jardines del Sur 310', coord: [-12.157, -76.943], offer: { 'Medicina general': modes, 'Geriatría': modes, 'Enfermería': ['Particular'] }, confirmed: false }
];
export const getCenter = id => centers.find(c => c.id === id);
export const norm = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
export function searchCenters({ query = '', type = '', service = '', mode = '' } = {}) { return centers.filter(c => norm(c.name + ' ' + c.district).includes(norm(query)) && (!type || c.type === type) && Object.entries(c.offer).some(([s, ms]) => (!service || s === service) && (!mode || ms.includes(mode)))); }
export function requirements(c, service, mode) { return ['Documento de identidad del paciente de ejemplo.', mode === 'SIS' ? 'Constancia de afiliación SIS de ejemplo.' : 'Registro en admisión para atención particular de ejemplo.', service === 'Geriatría' ? 'Lleva tu lista de medicamentos y controles previos si los tienes.' : 'Ten a mano el código de la cita.', 'Preséntate en admisión de ' + c.name + ' antes del horario elegido.']; }
export function distance(a, b) { const rad = n => n * Math.PI / 180; const d = Math.sin(rad(b[0] - a[0]) / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(rad(b[1] - a[1]) / 2) ** 2; return 6371 * 2 * Math.atan2(Math.sqrt(d), Math.sqrt(1 - d)); }
export const limaDay = (date = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
export function daysAhead(offset, now = new Date()) { const day = new Date(limaDay(now) + 'T12:00:00-05:00'); day.setUTCDate(day.getUTCDate() + offset); return limaDay(day); }
export function schedule(c, service, mode, now = new Date()) { if (!c || c.full || !c.offer[service]?.includes(mode))
    return []; const slots = []; for (let i = 1; i <= 7; i++) {
    const date = daysAhead(i, now);
    if (new Date(date + 'T12:00:00Z').getUTCDay() === 0)
        continue;
    for (const hour of (mode === 'SIS' ? ['09:30', '11:00'] : ['10:00', '15:30']))
        slots.push(date + 'T' + hour);
} return slots; }
export function initialAppointment(now = new Date()) { const preferred = '2026-11-25T09:30'; const slot = new Date(preferred + ':00-05:00') > now ? preferred : schedule(centers[0], services[0], modes[0], now)[0]; return { id: 'TA-DEMO01', owner: demo.email.toLowerCase(), center: 'sjm', service: services[0], mode: 'SIS', insurance: 'SIS', slot, patient: demo.name, dni: demo.dni, requester: demo.name, relation: 'Paciente', companion: demo.family, recipient: 'Paciente', channel: 'Correo', contact: demo.email, status: 'Confirmada', room: '02' }; }
export const future = a => new Date(a.slot + ':00-05:00').getTime() > Date.now();
export const showSlot = slot => new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(slot + ':00-05:00'));
export function route(c) { return 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(c.coord.join(',')); }
export function calendarText(a, c) { const utc = t => new Date(t).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); const start = new Date(a.slot + ':00-05:00'); return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Te Acompano//Cita demo//ES', 'BEGIN:VEVENT', 'UID:' + a.id + '@te-acompano.invalid', 'DTSTAMP:' + utc(Date.now()), 'DTSTART:' + utc(start), 'DTEND:' + utc(start.getTime() + 30 * 60000), 'SUMMARY:Cita de demostración - ' + a.service, 'LOCATION:' + c.name, 'END:VEVENT', 'END:VCALENDAR', ''].join('\r\n'); }
