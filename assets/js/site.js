(() => {
  'use strict';

  // Número comercial autorizado de JE Soluciones, en formato internacional sin símbolos.
  const WHATSAPP_NUMBER = '573183310300';

  const makeWhatsAppUrl = (message) =>
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  document.querySelectorAll('.whatsapp-link').forEach((link) => {
    link.href = makeWhatsAppUrl(link.dataset.waMessage || 'Hola JE Soluciones.');
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  });

  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('#main-nav');

  menuButton?.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(isOpen));
    navigation?.classList.toggle('open', isOpen);
  });

  navigation?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      menuButton?.setAttribute('aria-expanded', 'false');
      navigation.classList.remove('open');
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && navigation?.classList.contains('open')) {
      menuButton?.setAttribute('aria-expanded', 'false');
      navigation.classList.remove('open');
      menuButton?.focus();
    }
  });

  document.querySelectorAll('[data-year]').forEach((element) => {
    element.textContent = new Date().getFullYear();
  });

  const flow = [
    {
      id: 'device',
      prompt: '¿Qué equipo presenta el problema?',
      options: ['Computador de escritorio', 'Portátil', 'Otro equipo electrónico'],
    },
    {
      id: 'symptom',
      prompt: '¿Qué está ocurriendo?',
      options: [
        'No enciende',
        'Enciende pero no da imagen',
        'Está lento o se bloquea',
        'Se apaga de repente',
        'Se calienta o hace ruido',
        'No carga o la batería dura poco',
        'No se conecta a Wi-Fi o Internet',
        'Falla el teclado o el touchpad',
        'No tiene audio',
        'Tiene problemas de pantalla',
        'Sospecho de virus o problemas de software',
        'Tengo poco espacio de almacenamiento',
        'Tengo problemas con Windows',
        'Otro problema',
      ],
    },
    {
      id: 'recent',
      prompt: '¿Cuándo comenzó o qué pasó antes?',
      options: [
        'Hoy o hace pocos días',
        'Desde hace varias semanas',
        'Después de un golpe o contacto con líquido',
        'No estoy seguro',
      ],
    },
  ];

  const categories = [
    {
      id: 'hazard',
      terms: /humo|chispa|olor a quemado|bateria hinchada|bateria inflada|fuego/,
    },
    {
      id: 'liquid',
      terms: /mojad|mojo|liquid|agua|derram|humedad/,
    },
    {
      id: 'impact',
      terms: /golpe|caida|cayo/,
    },
    {
      id: 'power',
      terms: /no enciende|no prende|no arranca|no inicia|sin energia/,
    },
    {
      id: 'image',
      terms: /no da imagen|sin imagen|pantalla negra|enciende.*(pero|y).*imagen|no muestra imagen/,
    },
    {
      id: 'slow',
      terms: /lent|bloque|congel|demor|tarda/,
    },
    {
      id: 'shutdown',
      terms: /se apaga|apagado repentino|se reinicia|se reinicia solo/,
    },
    {
      id: 'heat',
      terms: /calient|temperatura|ventilador|ruido/,
    },
    {
      id: 'battery',
      terms: /no carga|cargador|bateria|autonomia/,
    },
    {
      id: 'wifi',
      terms: /wifi|wi fi|internet|red inalambrica|conexion/,
    },
    {
      id: 'input',
      terms: /teclado|touchpad|panel tactil|mouse|raton/,
    },
    {
      id: 'audio',
      terms: /audio|sonido|parlante|auricular|microfono/,
    },
    {
      id: 'screen',
      terms: /pantalla|display|lineas|parpadea|imagen/,
    },
    {
      id: 'security',
      terms: /virus|malware|publicidad|ventanas emergentes|software malicioso/,
    },
    {
      id: 'windows',
      terms: /windows|actualizacion|actualizar|pantalla azul|error del sistema/,
    },
    {
      id: 'storage',
      terms: /almacenamiento|espacio|disco|ssd|memoria llena/,
    },
  ];

  const advice = {
    liquid:
      'Apágalo y desconéctalo solo si puedes hacerlo sin riesgo. No intentes encenderlo ni cargarlo. Contacta a JE para coordinar una revisión.',
    hazard:
      'Deja de usar el equipo y no lo conectes ni cargues. Si puedes hacerlo sin acercarte a humo, calor o una batería hinchada, desconéctalo de la corriente. Contacta a JE para recibir indicaciones.',
    impact:
      'Si el equipo recibió un golpe o cayó, no lo abras ni fuerces su uso. Si la carcasa o la pantalla están dañadas, o notas calor o ruidos extraños, apágalo si es seguro y coordina una revisión.',
    power:
      'No enciende: no es posible confirmar el estado de los demás componentes hasta realizar una revisión. Comprueba el tomacorriente y el cable solo si no hay señales de daño; no abras el equipo.',
    image:
      'Si es un computador de escritorio, comprueba que el monitor esté encendido y en la entrada correcta. En un portátil, prueba el brillo. No presiones ni abras la pantalla; si continúa sin imagen, solicita una revisión.',
    slow:
      'Si todavía puedes usar el equipo, guarda una copia de tus archivos importantes y reinícialo una vez. Evita instalar programas de limpieza o borrar archivos del sistema.',
    shutdown:
      'Guarda tus archivos si el equipo sigue encendido. Si está muy caliente, apágalo y deja que se enfríe sobre una superficie firme. Si se repite, no fuerces su uso y consulta una revisión.',
    heat:
      'Pon el equipo sobre una superficie firme y deja libres sus rejillas. Si está muy caliente, apágalo y permite que se enfríe. No introduzcas objetos ni abras el equipo.',
    battery:
      'Prueba el tomacorriente y el cargador solo si no presentan daños. Si la batería está hinchada, huele extraño o se calienta mucho, deja de usar y cargar el equipo; no la manipules.',
    wifi:
      'Comprueba si otro dispositivo puede conectarse a la misma red. Puedes reiniciar el router y volver a conectar el equipo. No compartas la contraseña de tu red en el resumen.',
    input:
      'Si tienes un periférico externo, comprueba si funciona. Reinicia el equipo cuando hayas guardado tu trabajo. No apliques líquidos ni retires teclas.',
    audio:
      'Revisa el volumen y el dispositivo de salida seleccionado. Si tienes audífonos, puedes probarlos. No instales controladores desde sitios no oficiales.',
    screen:
      'Guarda tu trabajo si todavía puedes ver la imagen y ajusta el brillo desde el sistema. No presiones el panel ni abras el equipo; una revisión puede identificar la causa.',
    security:
      'No abras enlaces ni ventanas sospechosas y no ingreses contraseñas en avisos emergentes. Usa la herramienta de seguridad incluida en tu sistema y evita descargar limpiadores desconocidos.',
    storage:
      'Respalda tus archivos importantes. Puedes revisar el espacio desde los ajustes del sistema; no borres carpetas del sistema ni archivos que no reconozcas.',
    windows:
      'Anota el mensaje o código de error. Si el equipo aún funciona, respalda tus archivos antes de cambios importantes y evita interrumpir una actualización en curso.',
    other:
      'Describe cuándo ocurre el problema y guarda tus archivos importantes si el equipo todavía funciona. Evita abrirlo o instalar programas desconocidos; JE puede revisar el caso.',
  };

  const normalize = (value) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const classify = (value) => {
    const normalized = normalize(value);
    return categories.find((category) => category.terms.test(normalized))?.id || 'other';
  };

  const chat = document.querySelector('[data-jeia]');
  let answers = {};

  const createElement = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };

  const beginChatUpdate = (prompt) => {
    chat.replaceChildren();
    const message = createElement('div', 'chat-message', prompt);
    message.setAttribute('role', 'status');
    message.setAttribute('tabindex', '-1');
    chat.append(message);
    message.focus({ preventScroll: true });
    return message;
  };

  function renderStep(stepIndex) {
    if (!chat) return;
    const step = flow[stepIndex];
    if (!step) {
      renderResult();
      return;
    }

    beginChatUpdate(step.prompt);
    const options = createElement('div', 'chat-options');

    step.options.forEach((option) => {
      const button = createElement('button', 'chat-option');
      button.type = 'button';
      const label = createElement('span', '', option);
      const arrow = createElement('span', '', '→');
      arrow.setAttribute('aria-hidden', 'true');
      button.append(label, arrow);
      button.addEventListener('click', () => {
        answers[step.id] = option;
        if (step.id === 'symptom') answers.category = classify(option);
        renderStep(stepIndex + 1);
      });
      options.append(button);
    });

    chat.append(options);

    if (step.id === 'symptom') {
      const form = createElement('form', 'chat-free-text');
      const label = createElement('label', '', '¿Quieres describirlo con tus palabras?');
      label.htmlFor = 'jeia-details';
      const field = createElement('textarea');
      field.id = 'jeia-details';
      field.name = 'details';
      field.rows = 3;
      field.maxLength = 280;
      field.placeholder = 'Ej.: se apaga después de unos minutos…';
      field.required = true;
      const continueButton = createElement('button', 'chat-option', 'Continuar con esta descripción →');
      continueButton.type = 'submit';
      form.append(label, field, continueButton);
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const details = field.value.trim();
        if (!details) {
          field.focus();
          return;
        }
        answers.details = details;
        answers.symptom = details;
        answers.category = classify(details);
        renderStep(stepIndex + 1);
      });
      chat.append(form);
    }

    const progress = createElement('p', 'chat-disclaimer', `Paso ${stepIndex + 1} de ${flow.length}`);
    chat.append(progress);
  }

  function renderResult() {
    if (!chat) return;
    let category = answers.category || classify(answers.symptom || '');
    const recent = normalize(answers.recent || '');
    if (category !== 'hazard' && category !== 'liquid') {
      if (recent.includes('contacto con liquido')) category = 'liquid';
      else if (recent.includes('golpe')) category = 'impact';
    }
    const guidance = advice[category] || advice.other;
    const summaryParts = [
      `Hola JE Soluciones. Necesito orientación para mi ${
        answers.device?.toLowerCase() || 'equipo'
      }.`,
      `Problema: ${answers.symptom || 'no especificado'}.`,
      `Comenzó: ${answers.recent || 'no indicado'}.`,
    ];

    if (answers.details && answers.details !== answers.symptom) {
      summaryParts.push(`Detalle: ${answers.details}.`);
    }
    summaryParts.push(`Orientación inicial de JE IA: ${guidance}`);

    beginChatUpdate('Esta orientación es general y no sustituye un diagnóstico técnico.');

    const result = createElement('div', 'chat-result');
    result.append(createElement('strong', '', 'Pasos iniciales sugeridos'));
    result.append(createElement('p', '', guidance));
    chat.append(result);

    const summary = createElement('div', 'chat-message');
    summary.append(createElement('strong', '', 'Resumen para JE'));
    summary.append(createElement('p', '', summaryParts.slice(0, 3).join(' ')));
    if (answers.details && answers.details !== answers.symptom) {
      summary.append(createElement('p', '', `Detalle: ${answers.details}`));
    }
    chat.append(summary);

    const actions = createElement('div', 'chat-actions');
    const whatsapp = createElement('a', 'button button-primary', 'Enviar resumen a JE');
    whatsapp.href = makeWhatsAppUrl(summaryParts.join(' '));
    whatsapp.target = '_blank';
    whatsapp.rel = 'noopener noreferrer';
    whatsapp.append(createElement('span', '', '↗'));
    actions.append(whatsapp);

    const restart = createElement('button', 'chat-reset', 'Empezar de nuevo');
    restart.type = 'button';
    restart.addEventListener('click', () => {
      answers = {};
      renderStep(0);
    });
    actions.append(restart);
    chat.append(actions);

    const safety = createElement(
      'p',
      'chat-disclaimer',
      'Si notas humo, chispas, olor a quemado o una batería hinchada, deja de usar el equipo y no lo cargues. Aléjate si hay calor o humo.',
    );
    chat.append(safety);
  }

  if (chat) renderStep(0);

  document.querySelectorAll('[data-tool="storage"]').forEach((select) => {
    select.addEventListener('change', () => {
      const output = select.closest('.tool-card')?.querySelector('.tool-output');
      const tips = {
        slow: 'Revisa el espacio libre, los programas de inicio y las actualizaciones. Si se congela con frecuencia, guarda tus archivos y consulta una revisión.',
        heat: 'Mantén libres las rejillas de ventilación y usa el equipo sobre una superficie firme. Un ventilador ruidoso o calor excesivo requiere revisión.',
        wifi: 'Reinicia el router y comprueba si otros dispositivos se conectan. Anota si el problema ocurre en una red o en todas.',
        battery: 'Observa si la carga cae de forma repentina o el equipo se apaga desconectado. Si la batería está hinchada, deja de usar el equipo.',
      };
      if (output) {
        output.textContent = tips[select.value] || 'Selecciona una situación para ver una guía inicial.';
      }
    });
  });
})();
