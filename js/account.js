import * as db from './storage.js';
import { demo, demoKey, centers } from './data.js';
import { view, btn, field, formData, select, error, state, demoNote, fact, esc, close } from './ui.js';
function enter(p, done, quick = false) { state.user = p; db.session.set(p); document.querySelector('#foot-account').textContent = 'Mi cuenta · ' + p.name.split(' ')[0]; return done(p, quick); }
export async function initSession() { await db.seed(); const key = db.session.get(); if (key) {
    const p = await db.profile(key);
    if (p)
        state.user = p;
} if (state.user)
    document.querySelector('#foot-account').textContent = 'Mi cuenta · ' + state.user.name.split(' ')[0]; }
export function access(done) { if (state.user)
    return done(state.user); login(done); }
function login(done) { view('Iniciar sesión', '<p class="sub">Entra con el perfil que creaste en este navegador.</p><form class="stack">' + field('email', 'Correo electrónico', '', 'type="email" required autocomplete="off"') + field('password', 'Clave de prueba', '', 'type="password" required autocomplete="off"') + '<button class="btn primary">Iniciar sesión</button></form><div class="actions">' + btn('Registrarme gratis', 'register') + btn('Entrar con usuario de prueba', 'demo') + '</div>' + demoNote, { register: () => registration(done), demo: async () => enter(await db.profile(demo.email), done, true), submit: async (e) => { const f = formData(e.target); const p = await db.signIn(f.email, f.password); if (!p)
        return error('El correo o la clave no coinciden con un perfil de este navegador.'); return enter(p, done); } }); }
function registration(done) { view('Registrarme gratis', '<p class="sub">Crea un perfil de demostración para consultar y solicitar citas.</p>' + demoNote + '<form class="stack"><div class="form-grid">' + field('name', 'Nombre y apellidos', '', 'required minlength="3" maxlength="90"') + field('dni', 'DNI de prueba', '', 'inputmode="numeric" required pattern="[0-9]{8}" maxlength="8" title="Escribe 8 dígitos"') + field('email', 'Correo de prueba', '', 'type="email" required maxlength="100"') + field('password', 'Clave de prueba (8 caracteres o más)', '', 'type="password" required minlength="8" maxlength="100" autocomplete="new-password"') + field('phone', 'Celular de ejemplo', '', 'type="tel" maxlength="20"') + field('address', 'Dirección de ejemplo', '', 'maxlength="120"') + field('family', 'Nombre del familiar (opcional)', '', 'maxlength="90"') + select('insurance', 'Seguro', ['SIS', 'Otro seguro', 'Sin seguro', 'No lo sé'], 'No lo sé') + select('site', 'Sede de referencia', centers.map(c => [c.id, c.name]), 'sjm') + '</div><label class="check-label"><input type="checkbox" required>Entiendo que este registro es local y usaré datos ficticios.</label><button class="btn primary">Crear mi perfil gratis</button></form>' + btn('Volver al inicio de sesión', 'login'), { login: () => login(done), submit: async (e) => { const f = formData(e.target); const password = f.password; delete f.password; f.name = f.name.trim(); if (f.name.length < 3)
        return error('Escribe el nombre y los apellidos de ejemplo.'); try {
        const p = await db.register(f, password);
        return enter(p, done);
    }
    catch (err) {
        if (err.name === 'ConstraintError')
            return error('Este correo ya tiene un perfil en este navegador. Puedes iniciar sesión.');
        throw err;
    } } }); }
export function account(consult) { access(p => view('Mi cuenta', fact([['Nombre', p.name], ['DNI de prueba', p.dni], ['Correo', p.email], ['Celular', p.phone], ['Dirección', p.address], ['Familiar', p.family], ['Seguro', p.insurance], ['Sede de referencia', centers.find(c => c.id === p.site)?.name]]) + '<div class="actions">' + btn('Consultar mis citas', 'consult', 'primary') + btn('Cerrar sesión', 'logout') + '</div>', { consult, logout: () => { db.session.clear(); state.user = null; document.querySelector('#foot-account').textContent = 'Mi cuenta'; view('Sesión cerrada', '<p>Tu perfil sigue disponible en este navegador.</p>' + btn('Volver al inicio', 'end'), { end: () => close(true) }); } })); }
