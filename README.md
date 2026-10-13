Se instala Claude code a través de powershell

se escriben los comandos mkdir gatitos-landing
luego cd gatitos-landing

aseguro estar dentro de la carpeta, se selecciona yes I trust this folder

Se cambia el auto mode on con shift+tab para cambiar de modo auto a manual
Se elije con /model a Sonnet como modelo más liviano

dentro de Claude Code se escribe el prompt: 

Quiero hacer una landing page para una tienda online de productos para gatos.
 Soy principiante y nunca he usado Claude Code, 
así que explícame cada paso de forma simple. 
Antes de escribir código, propón la estructura de la página (secciones) 
y un sistema de diseño (colores, tipografías, botones) 
y espera mi aprobación.


Se aprueba la estructura propuesta con el siguiente ajuste: 

1. Me gusta la estructura sigamos con esa. 
2.Los colores por favor trata que sean pasteles con estilo kawaii
  harajuku. 
3. El nombre de la tienda se llamará Michi Boutique Kawaii, usa ejemplos de esa temática. 
4. Sí, quiero
  que sea en español y responsiva para todos los dispositivos. 
Guarda el sistema de diseño (colores, tipografías,
botones) en un archivo DESIGN.md y úsalo como guía para toda la página.

Página creada, Michi Boutique Kawaii

QA revisión manual: 
Se abre la página desde el index, se realizan ajustes con Claude Code, se verifica que sea responsiva con 
todos los dispositivos moviles a través de f12.

Test automáticos con el siguiente prompt: 
Revisa la página como un QA: busca enlaces rotos, textos faltantes, problemas de accesibilidad y de responsive. 
Si puedes, crea tests simples que verifiquen que las secciones principales existen y que los botones funcionan, 
ejecútalos y corrige lo que falle hasta que pasen. Explícame qué encontraste.

Claude pide permiso para ejecutar un comando, se instala Node.js como herramientas para correr tests, nuevo prompt:
Ya instalé Node, ahora sí lo tienes disponible. 
Continúa con la revisión QA: crea tests que verifiquen que las secciones principales existen 
y que los botones funcionan, ejecútalos y corrige lo que falle hasta que pasen. 
Explícame qué encontraste.

Claude responde con: 

Los 29 tests pasan. Se ejecutan con npm test desde gatitos-landing.

Qué verifican
- Secciones: que existan la barra superior, #inicio, #categorias, #productos, #beneficios, #opiniones, 
#oferta y el pie #contacto. También que haya un solo h1, 4 categorías, 6 productos 
(cada uno con nombre, precio y botón), 4 beneficios y 3 opiniones.
- Enlaces: que todos los #ancla apunten a un id que existe.
- Menú hamburguesa: que abra y cierre, que se cierre al elegir un enlace, 
y que aria-expanded y el icono ☰/✕ cambien bien.
- Botones "Añadir": que muestren "¡Añadido!" y vuelvan a "Añadir".
- Formulario: que muestre el mensaje de gracias, limpie el campo y no recargue la página. 
También que valide el formato del correo.
- Calidad básica: idioma es, title y description, ids únicos, textos alternativos, 
y que las variables de color usadas en el HTML existan en styles.css.

Qué encontré y corregí
1. Bug en "Añadir": si se pulsaba dos veces rápido, el botón se quedaba para siempre en "¡Añadido! 💖". 
La segunda pulsación guardaba ese texto como si fuera el original. 
Ahora el texto original se guarda una sola vez y el temporizador se reinicia en cada clic.
2. Enlaces del pie sin destino: Instagram, TikTok, Facebook, Términos, Privacidad y 
Envíos tenían href="#" y al pulsarlos la página saltaba arriba. Los marqué con data-pendiente y bloqueé ese salto.

Pendiente tuyo: esos 6 enlaces siguen sin destino real. 
No inventé URLs; cuando las tengas, cambia el href y quita data-pendiente. 
El test actual aceptaría un # sin marcar solo si lo marcas, así que no te avisará cuando los enlaces estén listos.

Limitaciones
- Los tests corren en jsdom, que no dibuja la página. No comprueban el aspecto, 
el diseño responsivo ni que el menú móvil se vea bien en pantalla; para eso habría que probar en un navegador real.
- jsdom 25 en adelante no funciona con tu Node 20.10, así que fijé la versión 24 en package.json.
- Con el comando de PowerShell que usé para marcar los enlaces, 
index.html pudo quedar guardado con BOM (una marca invisible al inicio del archivo). 
No debería afectar al navegador, pero tampoco lo comprobé.

Claude hizo el loop completo, probó, encontró fallas, corrigió y volvió a probar.
-29 Test pasan, verificó secciones, menú, botones "añadir", formulario y calidad básica
-Bugs corregidos: si se hacía click dos veces rápido en añadir el botón se quedaba pegado en "añadido"
-6 enlaces sin destino real (instagram, tiktok, facebook, terminos, privacidad y envios, claude no inventó URLs
los dejó marcados como pendientes

Se le pide que lo pruebe en un navegador real
Claude crea un archivo de pruebas nuevo, navegador.test.js, lo que crea un archivo dentro de la carpeta del proyecto

Segundo loop:

Probé la página en Chrome real (con Playwright) y pasan los 39 tests: los 29 de antes (jsdom) y 10 nuevos en tests/navegador.test.js. Se ejecutan con npm test. Las capturas quedaron en tests/capturas/.

Qué comprobé
- Escritorio (1280px): las 7 secciones se ven, no hay errores de JavaScript y no hay scroll horizontal. 
La hamburguesa está oculta. El clic en "Productos" del menú te lleva a esa sección.
- Botón "Añadir": con doble clic real cambia a "¡Añadido!" y vuelve a "Añadir". 
Con esto confirmé la corrección del bug de antes.
- Formulario: un correo inválido queda bloqueado por el navegador y no muestra mensaje. 
Uno válido muestra el agradecimiento y vacía el campo.
- Enlaces del pie pendientes: al pulsarlos, la página ya no salta arriba.
- Celular (375px): no hay scroll horizontal y el diseño queda en una columna. 
El menú empieza cerrado, la hamburguesa lo abre (la captura lo muestra con el icono ✕)
 y se cierra al elegir un enlace, desplazándose a la sección correcta.

Qué encontré y corregí
- Los botones "Añadir" medían 37,8px de alto, por debajo de los ~44px recomendados para tocar con el dedo. 
Subí el relleno vertical en styles.css (.btn-chico, de .4rem a .6rem) y ahora pasan.

Limitaciones
- Probé solo en Chrome. Edge también está instalado, pero no lo probé; Safari y Firefox tampoco.
- No hice una revisión visual detallada de escritorio. Solo vi las capturas de celular, 
y el diseño me pareció correcto.
- Las fuentes de Google se cargan desde internet. Si no hay conexión, 
la página usará otra tipografía y se verá distinta.
- Los 6 enlaces del pie siguen sin destino real; esa parte es tuya, como te dije antes.

Se prueba la página en index en chrome.

Se crea repositorio en github, url: https://github.com/alejandradev00/michi-boutique-kawaii.git

Se sube el código a github con claude con el siguiente prompt: 
Crea un archivo .gitignore para no subir node_modules ni tests/capturas. 
Inicializa git en esta carpeta, haz el primer commit y 
conéctalo con mi repositorio https://github.com/alejandradev00/michi-boutique-kawaii.git. 
Luego sube el código a la rama main. Explícame cada paso de forma simple.

Luego se importa a vercel, se prueba en el celular y está ok!
Se ve en una sola columna sin desbordarse hacia el lado
los menú dirigen a las secciones
los botones añadir funcionan
el formulario muestra el mensaje de gracias

Resultados:
Link público de la página en vercel
DESIGN.md con el sistema de diseño (está en el repositorio)
39 Test corriendo con npm test
Dos loops de QA: el bug de botón añadido y el tamaño tácticl de los botones
Repositorio en github, todo hecho con claude desde la terminal

Se encontró un bug en el celular, los botones no llevan a la categoría, solo al apartado de sushi
se le dice a claude con el siguiente promtp: 
Encontré un bug en celular (pantalla de 375px). Al tocar cualquier categoría 
(Accesorios, Camas y rascadores, etc.), la página siempre me lleva a "Snacks Sushi Kawaii", 
sin importar cuál toqué. En escritorio funciona bien. Quiero que hagas esto en orden:
1. Reproduce el bug en Chrome real con Playwright a 375px y 
dime qué causa exactamente (revisa si hay etiquetas div sin cerrar o mal anidadas, 
si los enlaces o ids de las categorías están repetidos o mal asignados, y si algo se superpone y captura el toque).
2. Antes de arreglarlo, escribe un test que falle por este bug: 
que al tocar cada categoría en celular, la página muestre la sección o los productos de ESA categoría.
3. Corrige el bug.
4. Ejecuta todos los tests y confirma que pasan.
5. Explícame qué estaba mal en palabras simples.

Qué estaba mal, en palabras simples

La causa: los cuatro botones de categoría (Comida, Juguetes, Camas y rascadores, Accesorios) 
tenían la misma dirección, #productos. Esa dirección lleva al inicio de toda la lista de productos, 
no a una categoría. En el celular la lista es de una sola columna, 
así que lo primero que se ve ahí es "Snacks Sushi Kawaii". 
Tocar "Comida" parecía funcionar, pero solo porque Snacks es el primer producto de la lista. 
Tampoco había forma de saber a qué categoría pertenecía cada producto.

Lo que descarté en la revisión:
- No hay <div> sin cerrar: hay 49 abiertos y 49 cerrados.
- No hay ids repetidos.
- Nada tapa el toque: en cada caso el toque caía sobre el enlace correcto. 
La navegación sí ocurría, pero al destino equivocado.
- La barra fija de arriba, de 67px, tapaba el borde superior del destino de los enlaces. 
Es un problema menor, pero lo corregí también.

Qué cambié:
- Cada producto ahora lleva su categoría (data-categoria).
- El primer producto de cada categoría tiene un id propio: cat-comida, cat-juguetes, cat-camas y cat-accesorios.
- Cada botón de categoría apunta ahora a su id.
- scroll-margin-top en styles.css evita que la barra fija tape el producto al que se llega.

El test nuevo está en tests/navegador.test.js. Usa Chrome real a 375px con toque táctil. 
Toca cada categoría y comprueba que el primer producto visible bajo la barra sea de esa categoría. 
Antes del arreglo fallaba en Juguetes, Camas y Accesorios, y ahora pasa en las cuatro.

Una limitación: al tocar una categoría la página va a su primer producto, 
no filtra la lista. Por ejemplo, tocar "Juguetes" te lleva a Pelotitas Mochi y 
la Caña Estrellita Mágica queda más abajo en la lista. 
Si prefieres que se muestren solo los productos de esa categoría, 
hay que agregar filtrado con JavaScript, y puedo hacerlo.

No hice commit; los cambios están sin confirmar.

Prompt: Haz commit con un mensaje que describa la corrección y sube los cambios a GitHub.

Hice el commit 7bcd50e ("Corrige categorías en celular: cada una lleva a sus productos") 
y lo subí a main en https://github.com/alejandradev00/michi-boutique-kawaii. 
Incluye index.html, styles.css y tests/navegador.test.js.

Se encontró la falla con revisión manual, Claude escribió un test que la reproduce, la corrigió
y el test queda protegiendo contra que vuelva a pasar, quedó arreglado

Se ejecuta el npm test y se revisa cuantos test pasan como prompt
Pasan los 43 tests y no falla ninguno.

El que cubre el bug es el grupo "al tocar cada categoría se llega a ESA categoría", 
en tests/navegador.test.js, dentro de Celular (375px). Tiene 4 pruebas, una por categoría:
- "Comida" muestra primero un producto de Comida
- "Juguetes" muestra primero un producto de Juguetes
- "Camas y rascadores" muestra primero un producto de Camas y rascadores
- "Accesorios" muestra primero un producto de Accesorios

Cada una abre Chrome real a 375px con toque táctil, 
toca la categoría y comprueba que el primer producto visible bajo la barra sea de esa categoría.











