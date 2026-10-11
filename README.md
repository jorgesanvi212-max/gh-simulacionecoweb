# SimulacionEcoWeb · SimuLab

Laboratorio web **gratuito** con 8 simuladores interactivos de economía, inventarios, cadena de suministro y colas. Cada simulador explica qué hace, qué significa cada parámetro, qué efectos verás y para qué sirve en los negocios.

| # | Simulador | Grupo |
|---|---|---|
| 01 | Oferta y demanda | Economía y finanzas |
| 02 | Interés compuesto y decisiones financieras | Economía y finanzas |
| 03 | Cantidad económica de pedido (EOQ) | Inventarios |
| 04 | Punto de reorden con demanda variable | Inventarios |
| 05 | Sistemas de revisión: continua vs. periódica | Inventarios |
| 06 | Efecto látigo (bullwhip effect) | Cadena de suministro |
| 07 | Beer Game (versión simplificada) | Cadena de suministro |
| 08 | Teoría de colas y cuellos de botella | Servicios |

## Stack

HTML5 (SPA con hash routing `#/eoq`) · Pico CSS 2.1.1 + tema Modernist (`css/theme.css`) · JavaScript nativo con módulos ES · Alpine.js 3.14.9 · Chart.js 4.5.0 · PRNG `mulberry32` con semilla · `localStorage` (`simulab:v1`). **Sin compilación ni dependencias**: las librerías se cargan desde jsDelivr.

## Estructura

```
index.html              shell SPA (header, sidebar, simulador, explicación, footer)
css/theme.css           tokens Modernist sobre variables de Pico (claro/oscuro)
js/app.js               Alpine.data('simulab'): estado, routing, persistencia
js/catalog.js           metadatos de los 8 simuladores (textos + parámetros)
js/state.js             carga de estado desde localStorage (tolerante a errores)
js/chart.js             wrapper de Chart.js (crea una vez, luego solo actualiza)
js/lib/random.js        mulberry32, gauss (Box–Muller), poisson (Knuth)
js/lib/stats.js         invNorm (Acklam), varianza, formato es-MX
js/lib/colors.js        paleta de series (tokens CSS)
js/sims/*.js            una función pura run(params, seed) por simulador
tests/sims.test.js      pruebas con node --test
docs/README-handoff.md  especificación de diseño (handoff de Claude Design)
```

Cada `js/sims/*.js` exporta `run(params, seed) → { chartTitle, xLabel, yLabel, chart, kpis, lectura, bars? }` sin acceso al DOM.

## Ejecutar en local

```bash
python3 -m http.server 8080   # o: npm start
# abrir http://localhost:8080
```
(Los módulos ES requieren servirse por HTTP; abrir el archivo con `file://` no funciona.)

## Pruebas

```bash
npm test        # equivale a: node --test   (Node 18+)
```

Cubren las pruebas mínimas del handoff (EOQ ≈ 979,8; oferta P* ≈ 31,43 / Q* ≈ 57,14; M/M/1 Lq = 0,5 y Wq = 0,1 h; bullwhip con σ = 0 → ×1; reproducibilidad por semilla) y además: extremos de todos los parámetros sin `NaN`, rangos del catálogo, formato y persistencia.

## Despliegue

Sitio estático sin build. Opciones gratuitas:

- **Cloudflare Pages** (recomendado en el handoff): *Create project* → conectar este repositorio → Framework preset **None**, build command vacío, output directory `/`. Cada push a `main` publica en `https://<proyecto>.pages.dev`.
- **GitHub Pages**: *Settings → Pages → Deploy from a branch → `main` / root*.

## Diseño

La fuente de verdad del diseño es el mockup `SimuLab.dc.html` de Claude Design; su especificación está en [`docs/README-handoff.md`](docs/README-handoff.md). Si el diseño cambia, actualiza ese documento (registro de cambios), `js/catalog.js` y el módulo de `js/sims/` afectado.

Licencia MIT.
