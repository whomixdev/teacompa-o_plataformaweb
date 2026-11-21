import { facilities } from './facilities.js';
import { $, btn, field, formData, select, view, state, close, esc } from './ui.js';

const recipient = 'whomy.xhitf@gmail.com';
export function report() {
    view('Reportar un dato', '<p class="sub">El equipo de Te Acompaño recibirá tu reporte. Describe el dato que cambió y omite documentos de identidad e información médica.</p><form class="stack">' + select('origin','¿Dónde encontraste el problema?',['Plataforma web','Establecimiento de salud'],'','Elige una opción') + '<div id="report-place"></div><div class="form-grid">' + field('name','Tu nombre',state.user?.name,'required maxlength="90" autocomplete="name"') + field('email','Correo para responderte',state.user?.email,'type="email" required maxlength="150" autocomplete="email"') + '</div><label>¿Qué encontraste y qué debería decir?<textarea name="detail" required minlength="10" maxlength="1600" rows="4"></textarea></label><p class="micro">Al enviar, FormSubmit procesará estos datos para entregarlos a ' + recipient + '.</p><button class="btn primary">Enviar reporte</button><p role="status" id="report-status"></p></form>', {
        change(e) { if (e.target.name === 'origin') $('#report-place').innerHTML = e.target.value === 'Establecimiento de salud' ? select('place','Sede',facilities.map(c=>c.name),'','Elige una sede') + field('date','Fecha de la visita (opcional)','','type="date"') : select('place','Sección de la web',['Inicio','Centros de salud','Citas','Cuenta','Requisitos','Ayuda','Otra'],'','Elige la sección'); },
        async submit(e) {
            const f = formData(e.target), button = e.target.querySelector('button');
            const id = crypto.randomUUID().slice(0,8).toUpperCase();
            const subject = '[Te Acompaño · ' + id + '] ' + f.origin;
            const fields = {Referencia:id, Origen:f.origin, 'Sede o sección':f.place, 'Fecha de visita': f.date || 'Sin indicar', Remitente:f.name, email:f.email, Descripción:f.detail};
            const body = Object.entries(fields).map(([k,v]) => k + ': ' + v).join('\n\n');
            const mail = 'mailto:' + recipient + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
            const status = $('#report-status');
            button.disabled = true; status.textContent = 'Enviando…';
            const controller = new AbortController(), timer = setTimeout(()=>controller.abort(),12000);
            try {
                const response = await fetch('https://formsubmit.co/ajax/' + recipient,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({...fields,_subject:subject,_template:'table'}),signal:controller.signal});
                const result = await response.json();
                if (!response.ok || String(result.success) !== 'true') throw Error();
                if (status.isConnected) view('Reporte recibido por el servicio de correo','<p>Referencia <strong>' + esc(id) + '</strong>. El equipo podrá responder a ' + esc(f.email) + '.</p><div class="actions">' + btn('Cerrar','end') + '</div>',{end:()=>close(true)});
            } catch {
                status.innerHTML = 'No recibimos confirmación del servicio. Tus datos siguen aquí. <a class="text-btn" href="' + esc(mail) + '">Abrir en mi correo para enviarlo</a>';
            } finally {clearTimeout(timer); button.disabled = false;}
        }
    });
}
