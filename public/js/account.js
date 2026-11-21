import * as db from './storage.js';
import { demo, centers } from './data.js';
import { facilities } from './facilities.js';
import { insuranceOptions, essaludPlans } from './coverage.js';
import { $, view, btn, field, formData, select, error, state, fact, esc } from './ui.js';

export async function initSession() {
    await db.seed();
    const key = db.session.get();
    state.user = key ? await db.profile(key) : null;
    const label = $('#head-account');
    label.textContent = state.user ? 'Mi cuenta' : 'Iniciar sesión';
    if (state.user) label.setAttribute('aria-label','Mi cuenta de ' + state.user.name);
}
function enter(p, target) {
    db.session.set(p);
    sessionStorage.setItem('te-acompano:volver', JSON.stringify(target));
    location.reload();
}
export function access(done, target = {action:'consult'}) {
    if (state.user) return done(state.user);
    login(target);
}
function login(target) {
    view('Iniciar sesión','<p class="sub">Usa tu cuenta de este navegador para ver tus visitas.</p><form class="stack">' + field('email','Correo electrónico','','type="email" required autocomplete="username"') + field('password','Contraseña','','type="password" required autocomplete="current-password"') + '<button class="btn primary">Iniciar sesión</button></form><div class="actions">' + btn('Registrarme gratis','register') + btn('Entrar con usuario de prueba','demo') + '</div><details><summary>Activar un perfil preparado</summary><p>Si recibiste tu archivo personal de Te Acompaño, ábrelo aquí con tu contraseña para activar la cuenta en este navegador.</p><form class="stack" data-import><label>Archivo personal<input type="file" name="file" accept=".json,application/json" required></label>' + field('secret','Contraseña del perfil','','type="password" required autocomplete="current-password"') + '<button class="btn outline">Activar mi perfil</button></form></details>',{
        register:()=>registration(target), demo:async()=>enter(await db.profile(demo.email),target),
        async submit(e) {
            if(e.target.hasAttribute('data-import')) return activate(e.target,target);
            const f=formData(e.target), p=await db.signIn(f.email,f.password);
            if(!p) return error('Revisa el correo y la contraseña. El perfil debe estar registrado en este navegador.');
            enter(p,target);
        }
    });
}
async function activate(form,target) {
    const file=form.elements.file.files[0], password=form.elements.secret.value;
    let p;
    try {
        if(!file || file.size > 15000) throw Error();
        const value=JSON.parse(await file.text()), decode=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
        if(value.format!=='te-acompano-1') throw Error();
        const raw=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);
        const k=await crypto.subtle.deriveKey({name:'PBKDF2',salt:decode(value.salt),iterations:600000,hash:'SHA-256'},raw,{name:'AES-GCM',length:256},false,['decrypt']);
        const bytes=await crypto.subtle.decrypt({name:'AES-GCM',iv:decode(value.iv)},k,decode(value.payload));
        const data=JSON.parse(new TextDecoder().decode(bytes));
        p={};
        for(const key of ['name','email','phone','address','insurance','lastVisit']) p[key]=String(data[key]||'').slice(0,160);
        if(!p.name || !p.email.includes('@')) throw Error();
    } catch {return error('Comprueba que elegiste tu archivo personal y escribiste su contraseña.');}
    if(await db.profile(p.email)) {
        const existing=await db.signIn(p.email,password);
        if(!existing) return error('Ya existe un perfil con este correo. Usa su contraseña local.');
        enter(existing,target);
    } else enter(await db.register(p,password),target);
}
const domains=['gmail.com','hotmail.com','outlook.com','yahoo.com','icloud.com'];
function registration(target) {
    view('Registrarme gratis','<p class="sub">Tu cuenta y tus visitas se guardan en este navegador.</p><form class="stack"><div class="form-grid">' + field('first','Nombres','','required maxlength="70" autocomplete="given-name"') + field('last','Apellidos','','required maxlength="80" autocomplete="family-name"') + field('email','Correo electrónico','','type="email" required autocomplete="email" maxlength="150" list="email-domains"') + '<datalist id="email-domains"></datalist>' + '<div id="domain-buttons" class="domain-buttons full" aria-label="Terminaciones de correo" hidden></div>' + field('password','Contraseña','','type="password" required minlength="12" maxlength="128" autocomplete="new-password" aria-describedby="password-help"') + '</div><p id="password-help" class="micro" role="status"></p><div class="form-grid">' + field('phone','Celular (opcional)','','type="tel" maxlength="22" autocomplete="tel"') + field('address','Residencia (opcional)','','maxlength="140" autocomplete="street-address"') + field('family','Familiar o acompañante (opcional)','','maxlength="90"') + select('insurance','Seguro o forma de pago',insuranceOptions,'No lo sé') + '</div><div id="plan-fields" class="form-grid"></div><button class="btn primary">Crear cuenta gratuita</button></form><div class="actions">' + btn('Ya tengo una cuenta','login') + '</div>',{
        login:()=>login(target),
        domain(el) {
            const input=$('#dialog [name=email]');
            const local=input.value.split('@')[0];
            input.dataset.domain=el.dataset.domain;
            if(local) input.value=local+'@'+el.dataset.domain;
            else input.placeholder='Tu nombre de usuario para @'+el.dataset.domain;
            input.focus();
            suggest(input.value);
            $('#domain-buttons').hidden=true;
        },
        input(e) {
            if(e.target.name==='email') suggest(e.target.value);
            if(e.target.name==='password') passwordHelp(e.target);
        },
        change(e) {
            if(e.target.name!=='insurance') return;
            const type=e.target.value;
            $('#plan-fields').innerHTML = type==='EsSalud' ? select('plan','Modalidad EsSalud',essaludPlans,'No conozco mi plan') : ['EPS','Seguro privado','SCTR','SOAT'].includes(type) ? field('provider','Entidad aseguradora','','required maxlength="100"') + field('plan','Nombre del plan (opcional)','','maxlength="100"') : '';
        },
        async submit(e) {
            const f=formData(e.target), pass=f.password;
            f.name=[f.first.trim(),f.last.trim()].join(' ');
            if(!f.first.trim() || !f.last.trim()) return error('Escribe tus nombres y apellidos.');
            delete f.password;
            try { enter(await db.register(f,pass),target); }
            catch(err){if(err.name==='ConstraintError') return error('Ese correo ya tiene un perfil en este navegador. Elige «Ya tengo una cuenta».');throw err;}
        }
    });
    function suggest(value) {
        const [local,domain='']=value.split('@');
        const choices=domains.filter(x=>x.startsWith(domain.toLowerCase()));
        const chips=$('#domain-buttons');
        chips.innerHTML=choices.map(x=>'<button type="button" data-do="domain" data-domain="'+x+'">@'+x+'</button>').join('');
        chips.hidden=document.activeElement?.name!=='email' || !choices.length;
        $('#email-domains').innerHTML = choices.map(x=>'<option value="'+esc(local+'@'+x)+'"></option>').join('');
    }
    function passwordHelp(input){
        const pass=input.value, checks=[pass.length>=12, /\p{L}/u.test(pass), /[0-9\p{P}\p{S}]/u.test(pass)];
        const rules=['12 caracteres','una letra','un número o símbolo'];
        $('#password-help').textContent='Tu contraseña debe incluir ' + rules.map((s,i)=>s+(checks[i]?' ✓':'')).join(' · ') + '.';
        input.setCustomValidity(checks.every(Boolean)?'':'Completa los requisitos de la contraseña.');
    }
    const email=$('#dialog [name=email]');
    email.onfocus=e=>suggest(e.target.value);
    email.onblur=()=>{
        if(email.dataset.domain && email.value.trim() && !email.value.includes('@')) email.value=email.value.trim()+'@'+email.dataset.domain;
    };
    suggest(''); passwordHelp($('#dialog [name=password]'));
}
export function account(consult) {
    access(p=>view('Mi cuenta', fact([['Nombre',p.name],['Correo',p.email],['Celular',p.phone],['Residencia',p.address],['Familiar',p.family],['Seguro',p.insurance],['Entidad',p.provider],['Plan',p.plan],['Última atención',p.lastVisit],['Sede de referencia',facilities.find(s=>s.id===p.site)?.name || centers.find(s=>s.id===p.site)?.name]].filter(([,v])=>v)) + '<div class="actions">'+btn('Consultar mis citas','consult','primary')+btn('Cerrar sesión','logout')+'</div>',{consult,logout:()=>{db.session.clear();location.reload();}}),{action:'account'});
}
