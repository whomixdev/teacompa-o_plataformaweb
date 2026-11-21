import test from 'node:test';
import assert from 'node:assert/strict';
import { centers, searchCenters, initialAppointment, schedule, requirements, calendarText, distance } from '../public/js/data.js';
const friday = new Date('2026-11-20T20:00:00-05:00');
test('Los filtros cruzan servicio y modalidad de la misma sede', () => {
    assert.deepEqual(searchCenters({ service: 'Odontología', mode: 'SIS' }), []);
    assert.equal(searchCenters({ query: 'alamos', service: 'Geriatría', mode: 'SIS' })[0].id, 'surco');
});
test('La posta sin cupos sigue visible en el directorio', () => {
    const [site] = searchCenters({ query: 'villa el salvador' });
    assert.deepEqual(schedule(site, 'Medicina general', 'SIS', friday), []);
});
test('La agenda muestra días futuros de Lima y respeta la modalidad', () => {
    const slots = schedule(centers[0], 'Medicina general', 'Particular', friday);
    assert.equal(slots[0], '2026-11-21T10:00');
    assert.ok(!slots.some(s => s.startsWith('2026-11-22')));
});
test('La cita de Juan Carlos conserva la fecha acordada y se exporta en UTC', () => {
    const a = initialAppointment(friday);
    assert.equal(a.companion, 'Juana Rosa Gonzales');
    assert.equal(a.slot, '2026-11-25T09:30');
    assert.match(calendarText(a, centers[0]), /DTSTART:20261125T143000Z/);
});
test('Una instalación posterior recibe una cita de prueba futura', () => {
    const later = new Date('2027-01-05T12:00:00-05:00');
    assert.ok(new Date(initialAppointment(later).slot + ':00-05:00') > later);
});
test('Los requisitos cambian con la modalidad y el servicio', () => {
    assert.ok(requirements(centers[1], 'Geriatría', 'SIS').some(x => x.includes('SIS')));
    assert.ok(requirements(centers[1], 'Geriatría', 'Particular').some(x => x.includes('particular')));
});
test('La comparación utiliza distancias en línea recta', () => {
    assert.equal(distance(centers[0].coord, centers[0].coord), 0);
    assert.ok(distance(centers[0].coord, centers[1].coord) > 0);
});
