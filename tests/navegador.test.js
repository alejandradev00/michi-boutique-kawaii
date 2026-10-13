const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright-core');

const url = pathToFileURL(path.join(__dirname, '..', 'index.html')).href;
const SHOTS = path.join(__dirname, 'capturas');
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

describe('Escritorio (1280px)', () => {
  test('carga sin errores de JS y las secciones son visibles', async () => {
    const { page, errores } = await abrir(1280, 800);
    for (const id of ['inicio', 'categorias', 'productos', 'beneficios', 'opiniones', 'oferta', 'contacto']) {
      assert.ok(await page.locator('#' + id).isVisible(), `#${id} no visible`);
    }
    assert.deepEqual(errores, []);
    await page.screenshot({ path: path.join(SHOTS, 'escritorio.png'), fullPage: true });
    await page.close();
  });

  test('no hay scroll horizontal', async () => {
    const { page } = await abrir(1280, 800);
    const sobra = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert.ok(sobra <= 0, `sobran ${sobra}px`);
    await page.close();
  });

  test('el botón hamburguesa está oculto y el menú visible', async () => {
    const { page } = await abrir(1280, 800);
    assert.ok(!(await page.locator('#menuBoton').isVisible()));
    assert.ok(await page.locator('#menu a', { hasText: 'Productos' }).isVisible());
    await page.close();
  });

  test('clic en "Productos" del menú desplaza hasta la sección', async () => {
    const { page } = await abrir(1280, 800);
    await page.locator('#menu a', { hasText: 'Productos' }).click();
    await page.waitForTimeout(1000);
    const top = await page.evaluate(() => document.getElementById('productos').getBoundingClientRect().top);
    assert.ok(top < 200 && top > -50, `top=${top}`);
    await page.close();
  });

  test('"Añadir" cambia el texto y vuelve; doble clic no lo rompe', async () => {
    const { page } = await abrir(1280, 800);
    const b = page.locator('[data-producto]').first();
    await b.scrollIntoViewIfNeeded();
    await b.dblclick();
    assert.match(await b.textContent(), /Añadido/);
    await page.waitForTimeout(1800);
    assert.equal((await b.textContent()).trim(), 'Añadir');
    await page.close();
  });

  test('formulario: correo inválido bloquea, válido muestra mensaje', async () => {
    const { page } = await abrir(1280, 800);
    await page.fill('#correo', 'no-es-correo');
    await page.click('#formulario button');
    assert.equal(await page.locator('#mensaje').textContent(), '');
    await page.fill('#correo', 'michi@ejemplo.com');
    await page.click('#formulario button');
    assert.match(await page.locator('#mensaje').textContent(), /Gracias/);
    assert.equal(await page.inputValue('#correo'), '');
    await page.close();
  });

  test('enlaces pendientes del pie no mueven la página', async () => {
    const { page } = await abrir(1280, 800);
    await page.locator('footer a[data-pendiente]').first().scrollIntoViewIfNeeded();
    const antes = await page.evaluate(() => scrollY);
    await page.locator('footer a[data-pendiente]').first().click();
    await page.waitForTimeout(500);
    assert.equal(await page.evaluate(() => scrollY), antes);
    await page.close();
  });
});

describe('Celular (375px)', () => {
  test('sin scroll horizontal y captura', async () => {
    const { page, errores } = await abrir(375, 700);
    const sobra = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert.ok(sobra <= 0, `sobran ${sobra}px`);
    assert.deepEqual(errores, []);
    await page.screenshot({ path: path.join(SHOTS, 'celular.png'), fullPage: true });
    await page.close();
  });

  test('el menú está oculto y la hamburguesa lo abre y cierra', async () => {
    const { page } = await abrir(375, 700);
    const enlace = page.locator('#menu a', { hasText: 'Beneficios' });
    assert.ok(await page.locator('#menuBoton').isVisible());
    assert.ok(!(await enlace.isVisible()), 'menú visible sin abrir');
    await page.click('#menuBoton');
    assert.ok(await enlace.isVisible(), 'menú no se abrió');
    await page.screenshot({ path: path.join(SHOTS, 'celular-menu.png') });
    await enlace.click();
    await page.waitForTimeout(800);
    assert.ok(!(await enlace.isVisible()), 'menú no se cerró');
    const top = await page.evaluate(() => document.getElementById('beneficios').getBoundingClientRect().top);
    assert.ok(top < 250 && top > -50, `top=${top}`);
    await page.close();
  });

  describe('al tocar cada categoría se llega a ESA categoría', () => {
    const categorias = {
      'Comida': ['Snacks Sushi Kawaii'],
      'Juguetes': ['Pelotitas Mochi', 'Caña Estrellita Mágica'],
      'Camas y rascadores': ['Cama Nube Dormilona', 'Rascador Torre Arcoíris'],
      'Accesorios': ['Collar Fresita'],
    };
    for (const [nombre, productos] of Object.entries(categorias)) {
      test(`"${nombre}" muestra primero un producto de ${nombre}`, async () => {
        const browserCtx = await browser.newContext({ viewport: { width: 375, height: 700 }, hasTouch: true, isMobile: true });
        const page = await browserCtx.newPage();
        await page.goto(url);
        const enlace = page.locator('.categoria', { hasText: nombre });
        await enlace.scrollIntoViewIfNeeded();
        await enlace.tap();
        await page.waitForTimeout(1200);
        // Primer producto visible justo debajo de la barra fija
        const primero = await page.evaluate(() => {
          const barra = document.querySelector('.barra').getBoundingClientRect().bottom;
          const visibles = [...document.querySelectorAll('.producto')]
            .map(p => ({ top: p.getBoundingClientRect().top, nombre: p.querySelector('h3').textContent }))
            .filter(p => p.top >= barra - 1 && p.top < innerHeight)
            .sort((a, b) => a.top - b.top);
          return visibles[0] && visibles[0].nombre;
        });
        assert.ok(productos.includes(primero), `tocar "${nombre}" mostró "${primero}"; se esperaba uno de: ${productos.join(', ')}`);
        await browserCtx.close();
      });
    }
  });

  test('los botones "Añadir" tienen al menos 40px de alto (táctil)', async () => {
    const { page } = await abrir(375, 700);
    const alto = await page.locator('[data-producto]').first().evaluate(e => e.getBoundingClientRect().height);
    assert.ok(alto >= 40, `alto=${alto}`);
    await page.close();
  });
});
