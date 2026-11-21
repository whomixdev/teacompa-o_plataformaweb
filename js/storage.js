import { demo, demoKey, initialAppointment } from './data.js';
const key = s => s.trim().toLowerCase();
let ready;
function openDB() { if (!ready)
    ready = new Promise((resolve, reject) => { const req = indexedDB.open('te-acompano-demo-v1', 1); req.onupgradeneeded = () => { const db = req.result; db.createObjectStore('profiles', { keyPath: 'emailKey' }); const a = db.createObjectStore('appointments', { keyPath: 'id' }); a.createIndex('owner', 'owner'); a.createIndex('slotKey', 'slotKey', { unique: true }); db.createObjectStore('reports', { keyPath: 'id' }); }; req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); }).catch(e => { ready = null; throw e; }); return ready; }
async function run(table, mode, work) { const db = await openDB(); return new Promise((resolve, reject) => { const tx = db.transaction(table, mode); let result; try {
    work(tx.objectStore(table), v => { result = v; });
}
catch (e) {
    tx.abort();
    reject(e);
    return;
} tx.oncomplete = () => resolve(result); tx.onabort = () => reject(tx.error || new Error('Operación interrumpida')); }); }
const hex = b => Array.from(new Uint8Array(b), x => x.toString(16).padStart(2, '0')).join('');
async function verifier(password, salt) { const raw = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']); return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new Uint8Array(salt.match(/../g).map(s => parseInt(s, 16))), iterations: 310000, hash: 'SHA-256' }, raw, 256)); }
export async function register(fields, password) { const salt = hex(crypto.getRandomValues(new Uint8Array(16))); const record = { ...fields, emailKey: key(fields.email), salt, hash: await verifier(password, salt) }; await run('profiles', 'readwrite', s => s.add(record)); return record; }
export const profile = email => run('profiles', 'readonly', (s, set) => { const r = s.get(key(email)); r.onsuccess = () => set(r.result); });
export async function signIn(email, password) { const p = await profile(email); return p && await verifier(password, p.salt) === p.hash ? p : null; }
export async function seed() { if (!await profile(demo.email)) {
    try {
        await register(demo, demoKey);
    }
    catch (e) {
        if (e.name !== 'ConstraintError')
            throw e;
    }
} const a = initialAppointment(); await run('appointments', 'readwrite', s => { const r = s.get(a.id); r.onsuccess = () => { if (!r.result)
    s.add({ ...a, slotKey: slotKey(a) }); }; }); }
export const appointments = owner => run('appointments', 'readonly', (s, set) => { const r = s.index('owner').getAll(key(owner)); r.onsuccess = () => set(r.result.sort((a, b) => a.slot.localeCompare(b.slot))); });
export const slotKey = a => [a.center, a.service, a.slot].join('|');
export async function occupied() { return run('appointments', 'readonly', (s, set) => { const r = s.index('slotKey').getAllKeys(); r.onsuccess = () => set(new Set(r.result)); }); }
export async function reserve(a) { await run('appointments', 'readwrite', s => s.add({ ...a, slotKey: slotKey(a) })); }
export async function change(a, owner, patch) { let ok = false; await run('appointments', 'readwrite', s => { const r = s.get(a.id); r.onsuccess = () => { const existing = r.result; if (!existing || existing.owner !== key(owner) || existing.status === 'Cancelada' || existing.slot !== a.slot)
    return; const next = { ...existing, ...patch }; if (next.status === 'Cancelada')
    delete next.slotKey;
else
    next.slotKey = slotKey(next); s.put(next); ok = true; }; }); if (!ok)
    throw new Error('La cita cambió. Vuelve a consultarla.'); }
export const saveReport = (center, detail) => run('reports', 'readwrite', s => s.add({ id: crypto.randomUUID(), center, detail, created: new Date().toISOString() }));
export const session = { get: () => sessionStorage.getItem('te-acompano:perfil'), set: p => sessionStorage.setItem('te-acompano:perfil', p.emailKey), clear: () => sessionStorage.removeItem('te-acompano:perfil') };
