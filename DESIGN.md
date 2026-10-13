# Sistema de diseño · Michi Boutique Kawaii

Guía de estilo para toda la página. Si quieres cambiar un color o una fuente, edítalo
primero aquí y luego en las variables al inicio de `styles.css` (sección `:root`).

## Estilo
Kawaii + Harajuku: pasteles, formas redondeadas, bordes gruesos tipo "sticker",
sombras sólidas de colores, estrellitas, corazones y emojis de gatitos.

## Colores
| Nombre | Variable CSS | Código | Uso |
|---|---|---|---|
| Rosa chicle | `--rosa` | `#FF9CC9` | Botón principal, acentos |
| Rosa suave | `--rosa-suave` | `#FFD6E8` | Fondos de tarjetas, ofertas |
| Lavanda | `--lavanda` | `#CDB8F5` | Botón secundario, detalles |
| Menta | `--menta` | `#B5EBD7` | Fondos, etiquetas |
| Celeste | `--celeste` | `#B3DEF7` | Fondos, etiquetas |
| Mantequilla | `--amarillo` | `#FFF1A6` | Estrellas, destacados |
| Durazno | `--durazno` | `#FFD2B8` | Fondos de tarjetas |
| Fondo | `--fondo` | `#FFF6FB` | Fondo de la página |
| Blanco | `--blanco` | `#FFFFFF` | Tarjetas |
| Texto (ciruela) | `--texto` | `#4A2F5E` | Texto y bordes |

Regla: texto siempre en `--texto` (oscuro) sobre fondos pastel, para que se lea bien.

## Tipografías (Google Fonts)
- **Títulos:** Fredoka (600–700), redondeada y juguetona.
- **Texto:** Nunito (400–700), suave y fácil de leer.
- Tamaños: título principal 2.2–4rem (se adapta a la pantalla), secciones 1.8–2.6rem, texto 1rem.

## Formas y espacios
- Bordes: `3px solid var(--texto)` en tarjetas y botones (estilo sticker).
- Esquinas: `--radio` 24px (tarjetas), botones en forma de píldora (999px).
- Sombra: sólida, sin desenfoque, p. ej. `6px 6px 0 var(--lavanda)`.
- Separación entre secciones: 4–6rem.

## Botones
- **Principal (`.btn`)**: fondo rosa chicle, texto ciruela, borde ciruela, sombra sólida.
  Al pasar el ratón sube un poco y la sombra crece.
- **Secundario (`.btn-secundario`)**: igual pero con fondo lavanda.
- **Pequeño (`.btn-chico`)**: para "Añadir" en productos, menos relleno.
- Todos con foco visible (contorno) para quien navega con teclado.

## Responsivo
- Se diseña primero para celular, y se amplía con `@media (min-width: 700px)` y `(min-width: 1000px)`.
- Cuadrículas: 1 columna en celular, 2 en tableta, 3–4 en computadora.
- Menú: botón hamburguesa en celular.

## Imágenes
De momento se usan emojis e ilustraciones sobre fondos pastel. Cuando tengas fotos reales,
sustituye los `<div class="producto-img">` por `<img src="..." alt="...">`.
