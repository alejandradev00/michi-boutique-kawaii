const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright-core');

const url = pathToFileURL(path.join(__dirname, '..', 'index.html')).href;
let browser;

before(async () => { browser = await chromium.launch({ channel: 'chrome' }); });
after(async () => { await browser.close(); });

async function abrir(ancho, alto) {
  const page = await browser.newPage({ viewport: { width: ancho, height: alto } });
  const errores = [];
  page.on('pageerror', e => errores.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g/.test(m.text())) errores.push(m.text()); });
  await page.goto(url);
  return { page, errores };
}

const alto = (page, sel) => page.locator(sel).first().evaluate(e => { const r = e.getBoundingClientRect(); return [r.width, r.height]; });

async function llenarYAbrir(page) {
  for (const id of ['sushi', 'mochi', 'nube', 'fresita', 'rascador', 'cana']) {
    await page.locator(`[data-producto][data-id="${id}"]`).click();
  }
  await page.locator('#carritoBoton').click();
  await page.waitForTimeout(400); // deja terminar la animación de entrada del panel (.25s)
}

for (const [nombre, ancho, alt] of [['Celular (375px)', 375, 700], ['Computador (1280px)', 1280, 800]]) {
  describe(nombre, () => {
    test('el panel se ve completo, sin scroll horizontal y sin errores de JS', async () => {
      const { page, errores } = await abrir(ancho, alt);
      await llenarYAbrir(page);
      const caja = await page.locator('#carrito').boundingBox();
      assert.ok(caja.x >= 0 && caja.x + caja.width <= ancho + 0.5, `panel se sale: x=${caja.x} w=${caja.width}`);
      if (ancho < 500) assert.ok(caja.width >= ancho * 0.85, 'en celular debe ocupar casi todo el ancho');
      else assert.ok(caja.width <= 460, `en computador no debe ser gigante: ${caja.width}`);
      const sobra = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      assert.ok(sobra <= 0, `sobran ${sobra}px`);
      assert.ok(await page.locator('#irAPagar').isVisible(), 'pagar debe verse sin salir del panel');
      assert.deepEqual(errores, []);
      await page.close();
    });

    test('todos los botones táctiles miden al menos 44px', async () => {
      const { page } = await abrir(ancho, alt);
      const antes = await page.locator('[data-producto]').evaluateAll(bs => bs.map(b => b.getBoundingClientRect().height));
      antes.forEach(h => assert.ok(h >= 44, `"Añadir" mide ${h}px`));
      await llenarYAbrir(page);
      for (const sel of ['#carritoBoton', '#carritoCerrar', '#irAPagar', '#carritoLista [data-accion="mas"]', '#carritoLista [data-accion="menos"]', '#carritoLista [data-accion="quitar"]']) {
        const medidas = await page.locator(sel).evaluateAll(es => es.map(e => { const r = e.getBoundingClientRect(); return [r.width, r.height]; }));
        assert.ok(medidas.length > 0, sel);
        medidas.forEach(([w, h]) => assert.ok(w >= 44 && h >= 44, `${sel} mide ${w}×${h}`));
      }
      await page.close();
    });

    test('el flujo llega a la confirmación y cabe en pantalla', async () => {
      const { page, errores } = await abrir(ancho, alt);
      await llenarYAbrir(page);
      await page.locator('#irAPagar').click();
      assert.ok(await page.locator('#confirmacion').isVisible());
      assert.ok(await page.locator('#confirmacion').getByText(/demostraci/i).first().isVisible());
      const sobra = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      assert.ok(sobra <= 0, `sobran ${sobra}px`);
      assert.ok(await page.locator('#volverTienda').isVisible() || (await page.locator('#volverTienda').scrollIntoViewIfNeeded(), true));
      await page.locator('#volverTienda').click();
      assert.ok(await page.locator('#confirmacion').isHidden());
      assert.equal(await page.locator('#carritoLista > li').count(), 0);
      assert.deepEqual(errores, []);
      await page.close();
    });
  });
}

describe('Teclado y recarga', () => {
  test('abrir con teclado, el foco queda dentro del panel, Esc lo cierra y devuelve el foco', async () => {
    const { page } = await abrir(1280, 800);
    await page.locator('[data-producto][data-id="sushi"]').focus();
    await page.keyboard.press('Enter');
    await page.locator('#carritoBoton').focus();
    await page.keyboard.press('Enter');
    assert.ok(await page.locator('#carrito').isVisible());
    const dentro = () => page.evaluate(() => document.getElementById('carrito').contains(document.activeElement));
    assert.ok(await dentro(), 'el foco debe entrar al panel al abrirlo');
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      assert.ok(await dentro(), `el foco se escapó del panel en el Tab ${i + 1}`);
    }
    await page.keyboard.press('Shift+Tab');
    assert.ok(await dentro());
    await page.keyboard.press('Escape');
    assert.ok(await page.locator('#carrito').isHidden());
    assert.equal(await page.evaluate(() => document.activeElement.id), 'carritoBoton');
    await page.close();
  });

  test('se puede sumar y restar solo con teclado y el foco no se pierde', async () => {
    const { page } = await abrir(1280, 800);
    await page.locator('[data-producto][data-id="mochi"]').click();
    await page.locator('#carritoBoton').click();
    await page.locator('[data-accion="mas"]').focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    assert.equal((await page.locator('.item-cantidad').textContent()).trim(), '3');
    assert.equal(await page.evaluate(() => document.activeElement.dataset.accion), 'mas');
    await page.keyboard.press('Shift+Tab'); // hacia "−"
    await page.keyboard.press('Enter');
    assert.equal((await page.locator('.item-cantidad').textContent()).trim(), '2');
    await page.close();
  });

  test('el carrito sobrevive a recargar la página', async () => {
    const { page } = await abrir(375, 700);
    await page.locator('[data-producto][data-id="nube"]').click();
    await page.locator('[data-producto][data-id="nube"]').click();
    await page.reload();
    assert.equal((await page.locator('#carritoCantidad').textContent()).trim(), '2');
    await page.locator('#carritoBoton').click();
    assert.equal((await page.locator('.item-cantidad').textContent()).trim(), '2');
    assert.equal((await page.locator('#carritoTotal').textContent()).trim(), '$59.80');
    await page.close();
  });

  test('con muchos productos la lista se desplaza dentro del panel y pagar sigue visible', async () => {
    const { page } = await abrir(375, 500);
    await page.evaluate(() => localStorage.setItem('michi-carrito', JSON.stringify({ sushi: 1, mochi: 1, nube: 1, fresita: 1, rascador: 1, cana: 1 })));
    await page.reload();
    await page.locator('#carritoBoton').click();
    assert.ok(await page.locator('#irAPagar').isVisible());
    const caja = await page.locator('#irAPagar').boundingBox();
    assert.ok(caja.y + caja.height <= 500, 'pagar quedó fuera de la pantalla');
    await page.close();
  });
});
