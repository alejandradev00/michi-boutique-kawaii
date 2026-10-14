const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const CLAVE = 'michi-carrito';

// Abre la página; `guardado` simula lo que ya había en localStorage antes de cargar.
function abrir(guardado) {
  const dom = new JSDOM(html, {
    url: 'http://localhost/',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    beforeParse(w) {
      if (guardado !== undefined) w.localStorage.setItem(CLAVE, guardado);
    },
  });
  const doc = dom.window.document;
  const api = {
    dom, doc, win: dom.window,
    añadir: id => doc.querySelector(`[data-producto][data-id="${id}"]`).click(),
    abrirPanel: () => doc.getElementById('carritoBoton').click(),
    items: () => [...doc.querySelectorAll('#carritoLista > li')],
    item: id => doc.querySelector(`#carritoLista > li[data-id="${id}"]`),
    boton: (id, accion) => doc.querySelector(`#carritoLista [data-id="${id}"][data-accion="${accion}"]`),
    cantidad: id => api.item(id).querySelector('.item-cantidad').textContent.trim(),
    subtotal: id => api.item(id).querySelector('.item-subtotal').textContent.trim(),
    total: () => doc.getElementById('carritoTotal').textContent.trim(),
    insignia: () => doc.getElementById('carritoCantidad'),
    guardado: () => dom.window.localStorage.getItem(CLAVE),
  };
  return api;
}

describe('Agregar productos', () => {
  test('"Añadir" mete el producto al carrito con nombre, precio, cantidad y subtotal', () => {
    const c = abrir();
    c.añadir('sushi');
    assert.equal(c.items().length, 1);
    const li = c.item('sushi');
    assert.match(li.textContent, /Snacks Sushi Kawaii/);
    assert.match(li.querySelector('.item-precio').textContent, /\$7\.99/);
    assert.equal(c.cantidad('sushi'), '1');
    assert.equal(c.subtotal('sushi'), '$7.99');
  });

  test('añadir el mismo producto otra vez sube la cantidad (no duplica la fila)', () => {
    const c = abrir();
    c.añadir('sushi');
    c.añadir('sushi');
    assert.equal(c.items().length, 1);
    assert.equal(c.cantidad('sushi'), '2');
    assert.equal(c.subtotal('sushi'), '$15.98');
  });

  test('productos distintos van en filas distintas', () => {
    const c = abrir();
    c.añadir('sushi');
    c.añadir('mochi');
    assert.equal(c.items().length, 2);
  });

  test('cada uno de los 6 botones "Añadir" agrega su producto', () => {
    const c = abrir();
    const botones = c.doc.querySelectorAll('[data-producto]');
    assert.equal(botones.length, 6);
    botones.forEach(b => b.click());
    assert.equal(c.items().length, 6);
  });

  test('la insignia del botón del carrito cuenta las unidades', () => {
    const c = abrir();
    assert.equal(c.insignia().hidden, true);
    c.añadir('sushi');
    c.añadir('sushi');
    c.añadir('mochi');
    assert.equal(c.insignia().hidden, false);
    assert.equal(c.insignia().textContent.trim(), '3');
  });
});

describe('Cantidad: sumar, restar y quitar', () => {
  test('el botón + suma 1', () => {
    const c = abrir();
    c.añadir('mochi');
    c.boton('mochi', 'mas').click();
    assert.equal(c.cantidad('mochi'), '2');
    assert.equal(c.subtotal('mochi'), '$19.00');
  });

  test('el botón − resta 1', () => {
    const c = abrir();
    c.añadir('mochi');
    c.añadir('mochi');
    c.añadir('mochi');
    c.boton('mochi', 'menos').click();
    assert.equal(c.cantidad('mochi'), '2');
  });

  test('con cantidad 1, − no baja de 1 ni deja valores raros', () => {
    const c = abrir();
    c.añadir('mochi');
    const menos = c.boton('mochi', 'menos');
    assert.equal(menos.getAttribute('aria-disabled'), 'true');
    menos.click();
    menos.click();
    assert.equal(c.cantidad('mochi'), '1');
    assert.equal(c.total(), '$9.50');
  });

  test('tope de 99 por producto', () => {
    const c = abrir(JSON.stringify({ mochi: 98 }));
    c.boton('mochi', 'mas').click();
    assert.equal(c.cantidad('mochi'), '99');
    assert.equal(c.boton('mochi', 'mas').getAttribute('aria-disabled'), 'true');
    c.boton('mochi', 'mas').click();
    assert.equal(c.cantidad('mochi'), '99');
    c.añadir('mochi'); // tampoco desde "Añadir"
    assert.equal(c.cantidad('mochi'), '99');
  });

  test('"Quitar" saca el producto por completo', () => {
    const c = abrir();
    c.añadir('mochi');
    c.añadir('mochi');
    c.añadir('sushi');
    c.boton('mochi', 'quitar').click();
    assert.equal(c.item('mochi'), null);
    assert.equal(c.items().length, 1);
    assert.equal(c.total(), '$7.99');
  });
});

describe('Total', () => {
  test('suma correcta con el formato de moneda de la página', () => {
    const c = abrir();
    c.añadir('sushi'); c.añadir('sushi'); c.añadir('sushi'); // 3 × 7.99 = 23.97
    c.añadir('mochi');                                        // 9.50
    c.añadir('rascador');                                     // 44.00
    assert.equal(c.total(), '$77.47');
  });

  test('se actualiza solo al sumar, restar y quitar', () => {
    const c = abrir();
    c.añadir('fresita');
    assert.equal(c.total(), '$12.00');
    c.boton('fresita', 'mas').click();
    assert.equal(c.total(), '$24.00');
    c.boton('fresita', 'menos').click();
    assert.equal(c.total(), '$12.00');
    c.boton('fresita', 'quitar').click();
    assert.equal(c.total(), '$0.00');
  });

  test('no arrastra errores de decimales (precios en centavos)', () => {
    const c = abrir(JSON.stringify({ sushi: 3, cana: 3, nube: 3 }));
    // 3×7.99 + 3×6.50 + 3×29.90 = 23.97 + 19.50 + 89.70
    assert.equal(c.total(), '$133.17');
  });
});

describe('Carrito vacío', () => {
  test('muestra un mensaje amable y el botón de pagar está desactivado', () => {
    const c = abrir();
    const vacio = c.doc.getElementById('carritoVacio');
    assert.equal(vacio.hidden, false);
    assert.match(vacio.textContent, /vac/i);
    assert.equal(c.doc.getElementById('irAPagar').disabled, true);
    assert.equal(c.total(), '$0.00');
  });

  test('con productos el mensaje se oculta y pagar se activa', () => {
    const c = abrir();
    c.añadir('sushi');
    assert.equal(c.doc.getElementById('carritoVacio').hidden, true);
    assert.equal(c.doc.getElementById('irAPagar').disabled, false);
  });

  test('al quitar el último producto vuelve al estado vacío', () => {
    const c = abrir();
    c.añadir('sushi');
    c.boton('sushi', 'quitar').click();
    assert.equal(c.doc.getElementById('carritoVacio').hidden, false);
    assert.equal(c.doc.getElementById('irAPagar').disabled, true);
  });

  test('pagar con el carrito vacío no abre la confirmación', () => {
    const c = abrir();
    c.doc.getElementById('irAPagar').click();
    assert.equal(c.doc.getElementById('confirmacion').hidden, true);
  });
});

describe('Persistencia (localStorage)', () => {
  test('el carrito se guarda al cambiar', () => {
    const c = abrir();
    c.añadir('sushi');
    c.añadir('sushi');
    assert.deepEqual(JSON.parse(c.guardado()), { sushi: 2 });
  });

  test('al recargar la página el carrito sigue igual', () => {
    const primera = abrir();
    primera.añadir('sushi');
    primera.añadir('sushi');
    primera.añadir('nube');
    const segunda = abrir(primera.guardado());
    assert.equal(segunda.items().length, 2);
    assert.equal(segunda.cantidad('sushi'), '2');
    assert.equal(segunda.total(), '$45.88');
    assert.equal(segunda.insignia().textContent.trim(), '3');
  });

  test('datos dañados o raros se descartan o se corrigen', () => {
    const c = abrir(JSON.stringify({
      sushi: -5, mochi: 'abc', nube: 2.7, inventado: 3, fresita: 1e9, cana: 0, rascador: null,
    }));
    assert.deepEqual(c.items().map(li => li.dataset.id).sort(), ['fresita', 'nube']);
    assert.equal(c.cantidad('nube'), '2');
    assert.equal(c.cantidad('fresita'), '99');
  });

  for (const [nombre, valor] of [['texto que no es JSON', 'esto no es json'], ['una lista', '[1,2,3]'], ['null', 'null'], ['un número', '42']]) {
    test(`si lo guardado es ${nombre}, arranca vacío sin errores`, () => {
      const c = abrir(valor);
      assert.equal(c.items().length, 0);
      assert.equal(c.doc.getElementById('irAPagar').disabled, true);
      c.añadir('sushi');
      assert.equal(c.items().length, 1);
    });
  }

  test('sin localStorage disponible el carrito igual funciona (en memoria)', () => {
    const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true }); // origen opaco: localStorage falla
    const doc = dom.window.document;
    doc.querySelector('[data-producto][data-id="sushi"]').click();
    assert.equal(doc.querySelectorAll('#carritoLista > li').length, 1);
  });
});

describe('Panel del carrito', () => {
  test('el botón 🛒 abre el panel y ✕ lo cierra', () => {
    const c = abrir();
    const panel = c.doc.getElementById('carrito');
    const boton = c.doc.getElementById('carritoBoton');
    assert.equal(panel.hidden, true);
    assert.equal(boton.getAttribute('aria-expanded'), 'false');
    c.abrirPanel();
    assert.equal(panel.hidden, false);
    assert.equal(boton.getAttribute('aria-expanded'), 'true');
    c.doc.getElementById('carritoCerrar').click();
    assert.equal(panel.hidden, true);
    assert.equal(boton.getAttribute('aria-expanded'), 'false');
  });

  test('Esc cierra el panel', () => {
    const c = abrir();
    c.abrirPanel();
    c.doc.dispatchEvent(new c.win.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    assert.equal(c.doc.getElementById('carrito').hidden, true);
  });

  test('es un diálogo accesible con título y los botones tienen nombre', () => {
    const c = abrir();
    c.añadir('sushi');
    const panel = c.doc.getElementById('carrito');
    assert.equal(panel.getAttribute('role'), 'dialog');
    assert.ok(c.doc.getElementById(panel.getAttribute('aria-labelledby')));
    for (const accion of ['mas', 'menos', 'quitar']) {
      assert.match(c.boton('sushi', accion).getAttribute('aria-label'), /Snacks Sushi Kawaii/);
    }
    assert.ok(c.doc.getElementById('carritoBoton').getAttribute('aria-label'));
  });

  test('el nombre del producto no se interpreta como HTML', () => {
    const c = abrir();
    c.doc.querySelector('[data-id="sushi"]').dataset.producto = '<img src=x onerror=alert(1)>';
    c.añadir('sushi');
    assert.equal(c.item('sushi').querySelector('img'), null);
  });
});

describe('Pago simulado y confirmación', () => {
  test('flujo completo: añadir → carrito → "Ir a pagar mi pedido" → resumen', () => {
    const c = abrir();
    c.añadir('sushi'); c.añadir('sushi');
    c.añadir('fresita');
    c.abrirPanel();
    const pagar = c.doc.getElementById('irAPagar');
    assert.match(pagar.textContent, /Ir a pagar mi pedido/);
    pagar.click();

    const conf = c.doc.getElementById('confirmacion');
    assert.equal(conf.hidden, false);
    assert.equal(c.doc.getElementById('carrito').hidden, true);
    const texto = conf.textContent;
    assert.match(texto, /Snacks Sushi Kawaii/);
    assert.match(texto, /Collar Fresita/);
    assert.match(texto, /2/);
    assert.match(texto, /\$27\.98/);
    assert.match(texto, /demostraci/i);
    assert.match(texto, /no se cobr/i);
  });

  test('no pide ni guarda datos de tarjeta: no hay campos en el carrito ni en la confirmación', () => {
    const c = abrir();
    for (const id of ['carrito', 'confirmacion']) {
      assert.equal(c.doc.getElementById(id).querySelectorAll('input, select, textarea, form').length, 0, id);
    }
  });

  test('en localStorage solo se guardan ids y cantidades', () => {
    const c = abrir();
    c.añadir('sushi');
    c.doc.getElementById('irAPagar').click();
    assert.deepEqual(Object.keys(c.win.localStorage).sort(), [CLAVE]);
    assert.deepEqual(JSON.parse(c.guardado()), { sushi: 1 });
  });

  test('"Volver a la tienda" cierra la confirmación y vacía el carrito', () => {
    const c = abrir();
    c.añadir('sushi');
    c.doc.getElementById('irAPagar').click();
    c.doc.getElementById('volverTienda').click();
    assert.equal(c.doc.getElementById('confirmacion').hidden, true);
    assert.equal(c.items().length, 0);
    assert.equal(c.insignia().hidden, true);
    assert.deepEqual(JSON.parse(c.guardado() ?? '{}'), {});
  });
});

describe('Lo que ya existía sigue igual', () => {
  test('"Añadir" sigue mostrando "¡Añadido!" y volviendo a "Añadir"', async () => {
    const c = abrir();
    const b = c.doc.querySelector('[data-producto]');
    b.click();
    assert.match(b.textContent, /¡Añadido!/);
    await new Promise(r => setTimeout(r, 1700));
    assert.equal(b.textContent, 'Añadir');
  });
});
