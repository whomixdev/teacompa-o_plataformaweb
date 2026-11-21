import { $, btn, field, view, formData, fact, esc, state, error } from './ui.js';
import { access } from './account.js';
import { appointments, saveVisit, updateChecklist } from './storage.js';
import { findSite, mapsUrl, routing } from './guide.js';
import { showSlot } from './data.js';
import { consultation as legacy } from './consult.js';
const tasks=['Revisé los requisitos de la sede','Preparé los documentos que me indicaron','Coordiné la ruta y el acompañamiento'];
export function saveAppointment(f) {
    const resume={action:'save',selection:f};
    return access(p=>{
        const c=findSite(f.center);
        if(!c) return;
        view('Guardar mi visita','<p class="sub">Anota la fecha y la hora que la sede ya te confirmó. Esta ficha es tu recordatorio personal.</p>' + fact([['Sede',c.name],['Servicio',f.service],['Cobertura',f.mode]]) + '<form class="stack"><div class="form-grid">' + field('patient','Nombre del paciente',p.name,'required maxlength="120"') + field('companion','Acompañante (opcional)',p.family,'maxlength="120"') + field('date','Fecha confirmada','','type="date" required') + field('time','Hora confirmada (Lima)','','type="time" required') + '</div><button class="btn primary">Guardar en mis visitas</button></form>',{submit:async e=>{
            const v=formData(e.target);
            const a={kind:'visit',id:crypto.randomUUID(),owner:p.emailKey,center:c.id,service:f.service,mode:f.mode,slot:v.date+'T'+v.time,patient:v.patient.trim(),companion:v.companion.trim(),checklist:[]};
            if(!a.patient) return error('Indica el nombre del paciente.');
            await saveVisit(a);return detail(a);
        }});
    },resume);
}
export async function visits() {
    return access(async p=>{
        const all=await appointments(p.emailKey), current=all.filter(a=>a.kind==='visit'), old=all.filter(a=>a.kind!=='visit');
        const entries=current.map(a=>'<button class="list-button" data-do="open" data-id="'+esc(a.id)+'"><span><strong>'+esc(findSite(a.center)?.name)+'</strong><small>'+esc(showSlot(a.slot))+' · '+esc(a.service)+'</small></span></button>').join('');
        view('Mis citas','<p class="sub">Hola, '+esc(p.name.split(' ')[0])+'. Aquí están las visitas que guardaste en este navegador.</p><div class="stack">'+(entries || '<p class="empty">Todavía no has guardado una visita. Cuando la sede te confirme tu turno, anótalo aquí.</p>') + (old.length?btn('Consultar citas de demostración anteriores','legacy'):'') + '</div><div class="actions">'+btn('Pedir una cita médica','book','primary')+'</div>',{open:el=>detail(current.find(a=>a.id===el.dataset.id)),legacy:()=>legacy(),book:()=>document.querySelector('.quick [data-action=book]').click()});
    });
}
function detail(a) {
    const c=findSite(a.center);
    const summary=[c.name,c.address+', '+c.district,showSlot(a.slot),a.service].join('. ');
    view('Mi visita', '<p class="sub">Fecha y hora registradas por ti · Lima</p>' + fact([['Paciente',a.patient],['Sede',c.name],['Dirección',c.address+', '+c.district],['Fecha y hora',showSlot(a.slot)],['Servicio',a.service],['Cobertura',a.mode],['Acompañante',a.companion]]) + '<div class="actions">'+btn('Cómo llegar','route','primary')+('speechSynthesis' in window?btn('Escuchar mi visita','speak'):'')+'</div><h3>Antes de salir</h3><div class="stack">'+tasks.map((v,i)=>'<label class="check-label"><input type="checkbox" data-task="'+i+'" '+(a.checklist?.includes(i)?'checked':'')+'>'+v+'</label>').join('')+'</div><div class="actions">'+btn('Compartir con mi acompañante','preview')+btn('Volver a mis citas','list')+'</div>',{
        route:()=>routing(c),list:visits,
        speak(){speechSynthesis.cancel();const voice=new SpeechSynthesisUtterance(summary);voice.lang='es-PE';speechSynthesis.speak(voice);},
        change:async e=>{if(e.target.dataset.task===undefined) return;const i=Number(e.target.dataset.task),checked=e.target.checked;try {await updateChecklist(a,a.owner,i,checked);a.checklist=tasks.map((_,i)=>i).filter(i=>$('#dialog [data-task="'+i+'"]')?.checked);}catch(err){e.target.checked=!checked;throw err;}},
        preview(){
            const text=c.name+'\n'+showSlot(a.slot)+'\n'+c.address+', '+c.district+'\n'+mapsUrl(c);
            view('Compartir mi visita','<p>Tu acompañante verá la sede, la fecha, la hora y la ruta.</p><label>Mensaje<textarea readonly rows="6">'+esc(text)+'</textarea></label><div class="actions">'+btn(navigator.share?'Elegir destinatario':'Copiar mensaje','share','primary')+btn('Volver','back')+'</div><p id="share-status" role="status"></p>',{
                back:()=>detail(a),share:async()=>{try{if(navigator.share) await navigator.share({title:'Mi visita · Te Acompaño',text});else{await navigator.clipboard.writeText(text);$('#share-status').textContent='Mensaje copiado.';}}catch(e){if(e.name!=='AbortError'){const area=$('#dialog textarea');area.select();$('#share-status').textContent='Puedes copiar el mensaje seleccionado.';}}}
            });
        }
    });
}
