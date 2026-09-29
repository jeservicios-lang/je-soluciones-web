/* Small DOM smoke test for JE IA; runs with Node.js and no dependencies. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const number = '573183310300';
const source = fs.readFileSync('assets/js/site.js', 'utf8');

class Element {
  constructor(tagName) {
    this.tagName = tagName;
    this.children = [];
    this.attributes = {};
    this.listeners = {};
    this.dataset = {};
    this.className = '';
    this.text = '';
    this.value = '';
    this.classList = {
      contains: (name) => this.className.split(' ').includes(name),
      toggle: (name, force) => {
        const classes = new Set(this.className.split(' ').filter(Boolean));
        if (force) classes.add(name);
        else classes.delete(name);
        this.className = [...classes].join(' ');
      },
      remove: (name) => {
        this.className = this.className.split(' ').filter((item) => item !== name).join(' ');
      },
    };
  }

  set textContent(value) {
    this.text = String(value);
    this.children = [];
  }

  get textContent() {
    return this.text + this.children.map((child) => child.textContent).join('');
  }

  append(...children) {
    this.children.push(...children);
  }

  replaceChildren(...children) {
    this.children = [...children];
    this.text = '';
  }

  setAttribute(name, value) {
    this.attributes[name] = value;
  }

  getAttribute(name) {
    return this.attributes[name];
  }

  addEventListener(name, callback) {
    this.listeners[name] = callback;
  }

  focus() {}

  querySelectorAll(selector) {
    const matches = (element) => {
      if (selector.startsWith('.')) return element.className.split(' ').includes(selector.slice(1));
      return element.tagName === selector;
    };
    return this.children.flatMap((child) => [
      ...(matches(child) ? [child] : []),
      ...child.querySelectorAll(selector),
    ]);
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }
}

function createPage() {
  const contact = new Element('a');
  contact.dataset.waMessage = 'Hola JE Soluciones. Consulta de prueba.';
  const chat = new Element('div');
  const menu = new Element('button');
  menu.setAttribute('aria-expanded', 'false');
  const navigation = new Element('nav');
  const toolSelect = new Element('select');
  const toolOutput = new Element('div');
  toolOutput.className = 'tool-output';
  const toolCard = new Element('article');
  toolCard.append(toolOutput);
  toolSelect.closest = () => toolCard;
  toolCard.querySelector = (selector) => (selector === '.tool-output' ? toolOutput : null);
  const document = {
    createElement: (tag) => new Element(tag),
    querySelector: (selector) => {
      if (selector === '[data-jeia]') return chat;
      if (selector === '.menu-toggle') return menu;
      if (selector === '#main-nav') return navigation;
      return null;
    },
    querySelectorAll: (selector) => {
      if (selector === '.whatsapp-link') return [contact];
      if (selector === '[data-tool="storage"]') return [toolSelect];
      return [];
    },
    addEventListener() {},
  };
  vm.runInNewContext(source, { document, Date, encodeURIComponent });
  return { contact, chat, toolSelect, toolOutput };
}

function choose(chat, label) {
  const option = chat.querySelectorAll('.chat-option').find((button) => button.textContent.includes(label));
  assert.ok(option, `JE IA should offer: ${label}`);
  option.listeners.click();
}

const cases = [
  ['no enciende', 'no es posible confirmar el estado'],
  ['enciende pero no da imagen', 'monitor esté encendido'],
  ['está lento', 'copia de tus archivos'],
  ['se apaga de repente', 'Guarda tus archivos'],
  ['se calienta mucho', 'superficie firme'],
  ['no carga', 'Prueba el tomacorriente'],
  ['la batería dura poco', 'Prueba el tomacorriente'],
  ['Wi-Fi e Internet fallan', 'otro dispositivo'],
  ['teclado y touchpad fallan', 'periférico externo'],
  ['no tengo audio', 'Revisa el volumen'],
  ['la pantalla parpadea', 'Guarda tu trabajo'],
  ['creo que tengo un virus', 'ventanas sospechosas'],
  ['almacenamiento lleno', 'Respalda tus archivos'],
  ['error de Windows', 'Anota el mensaje'],
  ['se mojó con agua', 'No intentes encenderlo ni cargarlo'],
  ['humo y olor a quemado', 'Deja de usar el equipo'],
];

const generalPage = createPage();
assert.equal(
  generalPage.contact.href,
  `https://wa.me/${number}?text=${encodeURIComponent(generalPage.contact.dataset.waMessage)}`,
  'The general WhatsApp button should have the configured number and a prefilled message.',
);
assert.equal(generalPage.contact.target, '_blank');
assert.match(generalPage.contact.rel, /noopener/);

for (const [problem, expectedAdvice] of cases) {
  const { chat } = createPage();
  choose(chat, 'Portátil');
  const form = chat.querySelector('form');
  const details = chat.querySelector('textarea');
  details.value = problem;
  form.listeners.submit({ preventDefault() {} });
  choose(chat, 'No estoy seguro');

  const result = chat.querySelector('.chat-result');
  assert.ok(result.textContent.includes(expectedAdvice), `Unexpected guidance for: ${problem}`);
  const link = chat.querySelectorAll('a').find((anchor) => anchor.href.startsWith(`https://wa.me/${number}?`));
  assert.ok(link, `WhatsApp summary missing for: ${problem}`);
  assert.ok(link.href.includes(encodeURIComponent(problem)), `Summary should include: ${problem}`);
  assert.ok(link.href.includes(encodeURIComponent(expectedAdvice)), `Summary should include the guidance for: ${problem}`);
  assert.match(chat.textContent, /no sustituye un diagnóstico técnico/i);
}

const liquidAfterPowerOff = createPage();
choose(liquidAfterPowerOff.chat, 'Portátil');
choose(liquidAfterPowerOff.chat, 'No enciende');
choose(liquidAfterPowerOff.chat, 'contacto con líquido');
assert.match(
  liquidAfterPowerOff.chat.querySelector('.chat-result').textContent,
  /no intentes encenderlo ni cargarlo/i,
  'Liquid exposure should take priority over the selected symptom.',
);

const xssPage = createPage();
choose(xssPage.chat, 'Portátil');
const xssForm = xssPage.chat.querySelector('form');
const xssInput = xssPage.chat.querySelector('textarea');
const attack = '<img src=x onerror=alert(1)>';
xssInput.value = attack;
xssForm.listeners.submit({ preventDefault() {} });
choose(xssPage.chat, 'No estoy seguro');
assert.ok(xssPage.chat.textContent.includes(attack), 'User text should remain available in the summary.');
assert.equal(xssPage.chat.querySelector('img'), null, 'User input must not become markup.');
assert.ok(xssPage.chat.querySelector('a').href.includes(encodeURIComponent(attack)));

const toolsPage = createPage();
const toolCases = [
  ['slow', 'Revisa el espacio libre'],
  ['heat', 'superficie firme'],
  ['wifi', 'otros dispositivos'],
  ['battery', 'batería está hinchada'],
];
for (const [value, expected] of toolCases) {
  toolsPage.toolSelect.value = value;
  toolsPage.toolSelect.listeners.change();
  assert.ok(toolsPage.toolOutput.textContent.includes(expected), `Tool guide failed for: ${value}`);
}

console.log(`JE IA tests passed: ${cases.length} problem classes, WhatsApp draft, safety notice, and XSS text-only probe.`);
console.log(`Free tool checks passed: ${toolCases.length} selectable guides.`);
console.log('No WhatsApp message was sent.');
