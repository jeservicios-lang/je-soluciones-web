const WHATSAPP_NUMBER='573183310300';
const wa=(message)=>`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
const esc=(s)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cases={
 slow:{title:'Equipo lento',detail:'El comportamiento puede relacionarse con almacenamiento, memoria, temperatura, procesos en segundo plano o software.',steps:['Revisa si queda espacio libre en el almacenamiento.','Reinicia el equipo y observa si el problema aparece desde el inicio.','Comprueba si se calienta más de lo habitual.','Si continúa, JE puede revisar rendimiento y hardware.']},
 noimage:{title:'No da imagen',detail:'Puede estar relacionado con pantalla, memoria, alimentación, video, cableado o placa. La causa exacta requiere pruebas.',steps:['Comprueba brillo y alimentación.','Desconecta periféricos USB y prueba de nuevo.','Si tienes otro monitor compatible, puedes probarlo sin desmontar el equipo.','Si enciende pero sigue sin imagen, solicita revisión.']},
 power:{title:'No enciende',detail:'Primero hay que diferenciar una ausencia total de energía de un equipo que enciende pero no inicia.',steps:['Prueba otra toma eléctrica.','Revisa cargador, cable y conectores visibles.','Desconecta periféricos y prueba nuevamente.','Si no hay señales de vida, evita forzar el equipo y solicita revisión.']},
 hot:{title:'Se calienta',detail:'Puede relacionarse con polvo, ventilación obstruida, ventilador, pasta térmica o carga elevada.',steps:['No uses el equipo sobre cama o superficies que tapen ventilación.','Observa si los ventiladores funcionan.','Guarda tu trabajo si presenta bloqueos o apagados.','Solicita revisión si la temperatura es anormal.']},
 battery:{title:'No carga / batería',detail:'Puede involucrar cargador, conector, batería, circuito de carga o configuración.',steps:['Prueba otra toma y el cargador adecuado.','Observa si funciona conectado a corriente.','No fuerces conectores ni uses cargadores incompatibles.','Si falla de forma intermitente, solicita diagnóstico.']},
 internet:{title:'Internet / Wi-Fi',detail:'Primero conviene separar si falla el equipo, la red Wi-Fi o el servicio de Internet.',steps:['Reinicia el router y espera unos minutos.','Prueba otro dispositivo en la misma red.','Acerca el equipo al router para descartar señal.','Si otros dispositivos funcionan y este no, JE puede revisar configuración o hardware.']},
 audio:{title:'Audio',detail:'Puede ser configuración, controlador, salida seleccionada, conector o hardware.',steps:['Revisa volumen y dispositivo de salida.','Prueba audífonos y altavoces.','Reinicia el equipo.','Si solo falla una salida, puede requerir revisión.']},
 other:{title:'Otro problema',detail:'Organiza la información antes de contactar a JE: qué equipo es, qué ocurrió y qué señales presenta.',steps:['Anota marca y modelo si los conoces.','Describe qué ocurrió justo antes de la falla.','Indica luces, sonidos o mensajes que aparezcan.','Cuéntanos qué pruebas ya realizaste.']}
};
const typeLabels={desktop:'Computador de escritorio',laptop:'Computador portátil',other:'Otro equipo electrónico'};
const symptomLabels={power:'No enciende / no prende',noimage:'Enciende pero no da imagen',slow:'Está lento / se bloquea',hot:'Se calienta / se apaga',battery:'No carga / batería',internet:'Internet o Wi-Fi',audio:'Falla de audio',other:'Otro comportamiento'};
let ai={step:1,type:'',symptom:'',details:''};
const q=document.querySelector('#aiQuestion'), opts=document.querySelector('#aiOptions'), result=document.querySelector('#aiResult'), stepLabel=document.querySelector('#stepLabel'), bar=document.querySelector('#progressBar'), progress=document.querySelector('#aiProgress'), backButton=document.querySelector('#backAI'), controlHint=document.querySelector('#controlHint'), mascotTitle=document.querySelector('#mascotTitle'), mascotMessage=document.querySelector('#mascotMessage');
function updateGuide(done=false){
 if(done){mascotTitle.textContent='¡Listo!';mascotMessage.textContent='Ya preparé una guía inicial. Si quieres, envío tu resumen directamente al equipo de JE.';return;}
 if(ai.step===1){mascotTitle.textContent='¡Hola! Soy JE.';mascotMessage.textContent='Elige tu equipo y te acompaño paso a paso.';}
 if(ai.step===2){mascotTitle.textContent='Ya casi lo tenemos.';mascotMessage.textContent=`¿Qué problema presenta tu ${typeLabels[ai.type]?.toLowerCase()||'equipo'}?`;}
 if(ai.step===3){mascotTitle.textContent='Cuéntame un poco más.';mascotMessage.textContent='Descríbeme qué ves o cuándo sucede. No compartas contraseñas ni datos privados.';}
}
function renderAI(){
 result.hidden=true;stepLabel.textContent=`Paso ${ai.step} de 3`;bar.style.width=`${(ai.step/3)*100}%`;progress.setAttribute('aria-valuenow',String(ai.step));backButton.hidden=ai.step===1;
 controlHint.textContent=ai.step===1?'Elige una opción para continuar.':ai.step===2?'Puedes volver si deseas cambiar de equipo.':'Tus respuestas se guardan si vuelves al paso anterior.';updateGuide();
 if(ai.step===1){q.innerHTML='<h3>¿Qué equipo presenta el problema?</h3>';opts.innerHTML=Object.entries(typeLabels).map(([k,v])=>`<button type="button" class="${ai.type===k?'selected':''}" aria-pressed="${ai.type===k}" data-ai="type" data-value="${k}">${v}<span aria-hidden="true"> →</span></button>`).join('');}
 if(ai.step===2){q.innerHTML='<h3>¿Qué le está ocurriendo?</h3>';opts.innerHTML=Object.entries(symptomLabels).map(([k,v])=>`<button type="button" class="${ai.symptom===k?'selected':''}" aria-pressed="${ai.symptom===k}" data-ai="symptom" data-value="${k}">${v}<span aria-hidden="true"> →</span></button>`).join('');}
 if(ai.step===3){q.innerHTML='<h3>Cuéntame cuándo o cómo ocurre.</h3><p class="question-help">Ejemplo: “enciende, pero la pantalla queda negra”.</p>';opts.innerHTML=`<textarea id="aiDetails" maxlength="500" placeholder="Escribe aquí los detalles (opcional)...">${esc(ai.details)}</textarea><button class="continue" id="finishAI" type="button">Ver mi orientación →</button>`;document.querySelector('#aiDetails').addEventListener('input',event=>{ai.details=event.target.value;});}
 opts.querySelectorAll('[data-ai]').forEach(button=>button.addEventListener('click',()=>{ai[button.dataset.ai]=button.dataset.value;ai.step++;renderAI();}));
 const finish=document.querySelector('#finishAI');if(finish)finish.addEventListener('click',finishAI);
}
function finishAI(){
 const details=document.querySelector('#aiDetails');ai.details=(details?.value||ai.details||'').trim()||'Sin descripción adicional.';const base=cases[ai.symptom]||cases.other;const message=`Hola JE Soluciones 👋. Vengo desde JE IA.\nEquipo: ${typeLabels[ai.type]}\nProblema: ${symptomLabels[ai.symptom]}\nDetalle: ${ai.details}`;
 result.hidden=false;result.innerHTML=`<div class="result-tag">ORIENTACIÓN INICIAL</div><h3>${base.title}</h3><p>${base.detail}</p><ol>${base.steps.map(step=>`<li>${step}</li>`).join('')}</ol><div class="result-actions"><a class="btn primary" href="${wa(message+'\n\nQuiero solicitar revisión con JE.') }" target="_blank" rel="noopener">📲 Enviar mi caso a JE</a><button class="btn reset" id="resetAI" type="button">↻ Empezar de nuevo</button></div><small>Esta guía no identifica con certeza la causa ni reemplaza un diagnóstico técnico.</small>`;
 stepLabel.textContent='Orientación lista';bar.style.width='100%';progress.setAttribute('aria-valuenow','3');backButton.hidden=false;controlHint.textContent='Puedes volver para ajustar el problema o las respuestas.';updateGuide(true);
 document.querySelector('#resetAI').addEventListener('click',()=>{ai={step:1,type:'',symptom:'',details:''};renderAI();document.querySelector('#aiOptions button')?.focus();});
}
backButton.addEventListener('click',()=>{if(!result.hidden){result.hidden=true;stepLabel.textContent=`Paso ${ai.step} de 3`;controlHint.textContent='Tus respuestas se guardan si vuelves al paso anterior.';updateGuide();return;}if(ai.step>1){ai.step--;renderAI();}});
renderAI();
function guess(text){const t=text.toLowerCase();if(/no.*imagen|pantalla.*negra|sin.*imagen/.test(t))return'noimage';if(/lento|lenta|traba|pegado/.test(t))return'slow';if(/no.*enciende|no.*prende|muerto/.test(t))return'power';if(/calienta|caliente|sobrecal|temperatura/.test(t))return'hot';if(/carg|bater/.test(t))return'battery';if(/internet|wifi|wi-fi|red/.test(t))return'internet';if(/audio|sonido|parlante|altavoz/.test(t))return'audio';return'other';}
document.querySelectorAll('[data-tool]').forEach(btn=>btn.addEventListener('click',()=>{const a=cases[btn.dataset.tool]||cases.other;const box=document.querySelector('#toolResult');box.hidden=false;box.innerHTML=`<div class="result-tag">JE IA · HERRAMIENTA</div><h3>${a.title}</h3><p>${a.detail}</p><ol>${a.steps.map(s=>`<li>${s}</li>`).join('')}</ol><a class="text-link" href="${wa(`Hola JE Soluciones 👋. Usé una herramienta de JE IA. Mi problema es: ${a.title}. Quiero solicitar orientación o revisión.`)}" target="_blank" rel="noopener">📲 Continuar con JE por WhatsApp →</a>`;box.scrollIntoView({behavior:'smooth',block:'center'})}));
document.querySelectorAll('[data-wa]').forEach(a=>{a.href=wa(a.dataset.wa);a.target='_blank';a.rel='noopener'});
document.querySelector('#year').textContent=new Date().getFullYear();

const floatingAI=document.querySelector('.floating'), guidanceSection=document.querySelector('#je-ia');
if(floatingAI&&guidanceSection&&'IntersectionObserver' in window){new IntersectionObserver(entries=>floatingAI.classList.toggle('ai-in-view',entries[0]?.isIntersecting),{threshold:.15}).observe(guidanceSection);}

const menuButton=document.querySelector('#menuToggle'),mainNav=document.querySelector('#mainNav');
function closeMenu(){if(!menuButton||!mainNav)return;menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Abrir menú');mainNav.classList.remove('open')}
menuButton?.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')!=='true';menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú');mainNav?.classList.toggle('open',open)});
mainNav?.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&mainNav?.classList.contains('open')){closeMenu();menuButton?.focus()}});
