const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');

let dom, doc, win;

beforeEach(() => {
  dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true });
  win = dom.window;
  doc = win.document;
});

describe('Secciones principales', () => {
  test('existe la barra superior con logo y menú', () => {
    assert.ok(doc.querySelector('header.barra'));
    assert.ok(doc.querySelector('header .logo'));
    assert.ok(doc.querySelector('nav#menu'));
  });

  for (const id of ['inicio', 'categorias', 'productos', 'beneficios', 'opiniones', 'oferta', 'contacto']) {
    test(`existe la sección #${id}`, () => {
      assert.ok(doc.getElementById(id), `falta #${id}`);
    });
  }

  test('hay un único h1 en la portada', () => {
    assert.equal(doc.querySelectorAll('h1').length, 1);
    assert.ok(doc.querySelector('#inicio h1'));
  });

  test('hay 4 categorías, 6 productos, 4 beneficios y 3 opiniones', () => {
    assert.equal(doc.querySelectorAll('.categoria').length, 4);
    assert.equal(doc.querySelectorAll('.producto').length, 6);
    assert.equal(doc.querySelectorAll('.beneficio').length, 4);
    assert.equal(doc.querySelectorAll('.opinion').length, 3);
  });

  test('cada producto tiene nombre, precio y botón', () => {
    doc.querySelectorAll('.producto').forEach(p => {
      assert.ok(p.querySelector('h3').textContent.trim());
      assert.match(p.querySelector('.precio').textContent, /^\$\d+\.\d{2}$/);
      assert.ok(p.querySelector('button[data-producto]'));
    });
  });

  test('el pie de página tiene correo y derechos', () => {
    const f = doc.querySelector('footer#contacto');
    assert.match(f.textContent, /hola@michiboutique\.com/);
    assert.ok(f.querySelector('.derechos'));
  });
});

describe('Enlaces internos', () => {
  test('todos los enlaces #ancla apuntan a un id existente', () => {
    const rotos = [];
    doc.querySelectorAll('a[href^="#"]').forEach(a => {
      const href = a.getAttribute('href');
      if (href === '#') return;
      if (!doc.getElementById(href.slice(1))) rotos.push(href);
    });
    assert.deepEqual(rotos, []);
  });

  test('los enlaces "#" del pie están marcados como pendientes y no saltan al inicio', () => {
    const vacios = [...doc.querySelectorAll('footer a[href="#"]')];
    assert.ok(vacios.length > 0);
    vacios.forEach(a => {
      assert.ok(a.hasAttribute('data-pendiente'), `${a.textContent} sin marcar`);
      const ev = new win.MouseEvent('click', { cancelable: true, bubbles: true });
      a.dispatchEvent(ev);
      assert.ok(ev.defaultPrevented);
    });
  });

  test('los botones del hero llevan a productos y categorías', () => {
    const hrefs = [...doc.querySelectorAll('.hero-botones a')].map(a => a.getAttribute('href'));
    assert.deepEqual(hrefs, ['#productos', '#categorias']);
  });
});

describe('Menú hamburguesa', () => {
  test('abre y cierra con el botón', () => {
    const b = doc.getElementById('menuBoton');
    const m = doc.getElementById('menu');
    b.click();
    assert.ok(m.classList.contains('abierto'));
    assert.equal(b.getAttribute('aria-expanded'), 'true');
    assert.equal(b.textContent, '✕');
    b.click();
    assert.ok(!m.classList.contains('abierto'));
    assert.equal(b.getAttribute('aria-expanded'), 'false');
    assert.equal(b.textContent, '☰');
  });

  test('se cierra al pulsar un enlace del menú', () => {
    const b = doc.getElementById('menuBoton');
    const m = doc.getElementById('menu');
    b.click();
    m.querySelector('a').click();
    assert.ok(!m.classList.contains('abierto'));
    assert.equal(b.getAttribute('aria-expanded'), 'false');
  });

  test('aria-controls apunta al menú', () => {
    assert.equal(doc.getElementById('menuBoton').getAttribute('aria-controls'), 'menu');
  });
});

describe('Botones "Añadir"', () => {
  test('cada botón muestra "¡Añadido!" y luego vuelve al texto original', async () => {
    const botones = doc.querySelectorAll('[data-producto]');
    assert.equal(botones.length, 6);
    const b = botones[0];
    b.click();
    assert.match(b.textContent, /¡Añadido!/);
    await new Promise(r => setTimeout(r, 1700));
    assert.equal(b.textContent, 'Añadir');
  });

  test('pulsar dos veces rápido no deja el botón con el texto equivocado', async () => {
    const b = doc.querySelector('[data-producto]');
    b.click();
    b.click();
    await new Promise(r => setTimeout(r, 1700));
    assert.equal(b.textContent, 'Añadir');
  });
});

describe('Formulario de suscripción', () => {
  test('con correo válido muestra el mensaje de gracias y limpia el campo', () => {
    const input = doc.getElementById('correo');
    input.value = 'michi@ejemplo.com';
    doc.getElementById('formulario').dispatchEvent(new win.Event('submit', { cancelable: true, bubbles: true }));
    assert.match(doc.getElementById('mensaje').textContent, /Gracias/);
    assert.equal(input.value, '');
  });

  test('el submit no recarga la página (preventDefault)', () => {
    const ev = new win.Event('submit', { cancelable: true, bubbles: true });
    doc.getElementById('formulario').dispatchEvent(ev);
    assert.ok(ev.defaultPrevented);
  });

  test('el campo de correo es type=email, required y tiene etiqueta accesible', () => {
    const i = doc.getElementById('correo');
    assert.equal(i.type, 'email');
    assert.ok(i.required);
    assert.ok(i.getAttribute('aria-label'));
  });

  test('un correo inválido no pasa la validación del navegador', () => {
    const i = doc.getElementById('correo');
    i.value = 'no-es-correo';
    assert.equal(i.checkValidity(), false);
    i.value = 'ok@ejemplo.com';
    assert.equal(i.checkValidity(), true);
  });
});

describe('Calidad básica', () => {
  test('el idioma es español y hay title y description', () => {
    assert.equal(doc.documentElement.lang, 'es');
    assert.ok(doc.title);
    assert.ok(doc.querySelector('meta[name="description"]'));
  });

  test('todas las imágenes/SVG con role=img tienen texto alternativo', () => {
    doc.querySelectorAll('img, svg[role="img"]').forEach(el => {
      assert.ok(el.getAttribute('alt') || el.getAttribute('aria-label'));
    });
  });

  test('los ids son únicos', () => {
    const ids = [...doc.querySelectorAll('[id]')].map(e => e.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  test('las variables CSS usadas en el HTML existen en styles.css', () => {
    const usadas = new Set([...html.matchAll(/var\((--[\w-]+)\)/g)].map(m => m[1]));
    for (const v of usadas) {
      assert.ok(new RegExp(`${v}\\s*:`).test(css), `falta ${v} en styles.css`);
    }
  });

  test('las clases de menú usadas por el JS tienen estilo en el CSS', () => {
    assert.match(css, /\.menu\.abierto|\.abierto/);
  });
});
