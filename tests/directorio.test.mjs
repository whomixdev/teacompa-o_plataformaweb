import test from 'node:test';
import assert from 'node:assert/strict';
import {facilities} from '../public/js/facilities.js';
import {insuranceOptions,coverageGuide} from '../public/js/coverage.js';

test('Las 20 fichas tienen identidad única, fuentes y datos para planificar la visita',()=>{
    assert.equal(facilities.length,20);
    assert.equal(new Set(facilities.map(c=>c.id)).size,20);
    assert.equal(new Set(facilities.map(c=>c.type)).size,4);
    for(const c of facilities){
        for(const key of ['name','district','address','booking','hours']) assert.ok(c[key]?.trim(),c.id+' '+key);
        for(const link of [c.source,...c.sources||[],c.bookingUrl].filter(Boolean)) assert.equal(new URL(link).protocol,'https:');
        assert.ok(c.services.length && c.modes.length);
        assert.ok(c.modes.every(m=>insuranceOptions.includes(m)),c.id);
        for(const service of Object.keys(c.serviceHours||{})) assert.ok(c.services.includes(service),c.id);
    }
});
test('Cada cobertura seleccionable incluye instrucciones y fuente',()=>{
    for(const mode of insuranceOptions) {
        assert.equal(new URL(coverageGuide[mode].url).protocol,'https:');
        assert.ok(coverageGuide[mode].steps.length);
    }
});
