# SimuLab — README de handoff para Claude Code Web

Aplicación web estática y gratuita con 8 simuladores de economía, inventarios, cadena de suministro y colas. Este documento traduce el mockup `SimuLab.dc.html` (diseño + lógica funcional de referencia) a la implementación con el stack acordado.

> **Fuente de verdad del diseño:** `SimuLab.dc.html`. Todas las fórmulas, parámetros (rangos, pasos, valores por defecto), textos explicativos y reglas de simulación están en el arreglo `SIMS` de su clase lógica. Si el diseño cambia, **actualiza este README** (sección *Registro de cambios*) y vuelve a copiar `SIMS`.

---

## 1. Stack

| Capa | Tecnología | Versión |
|---|---|---|
| Estructura | HTML5, SPA con pestañas (hash routing `#/eoq`) | — |
| Estilos | Pico CSS (CDN) + `css/theme.css` (tokens Modernist) | 2.1.1 |
| Lógica | JavaScript nativo, módulos ES | ES2022 |
| UI reactiva | Alpine.js (CDN) | 3.14.9 |
| Gráficas | Chart.js (CDN) | 4.5.0 |
| Aleatoriedad | `mulberry32` con semilla | propio |
| Persistencia | `localStorage` clave `simulab:v1` | nativa |
| Repositorio | GitHub | — |
| Hosting | Cloudflare Pages (sin build) | gratis |

CDN sugeridos:
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2.1.1/css/pico.min.css">
<link rel="stylesheet" href="css/theme.css">
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.9/dist/cdn.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.5.0/dist/chart.umd.min.js"></script>
<script type="module" src="js/app.js"></script>
```
`app.js` debe registrar los componentes Alpine en `alpine:init` antes de que Alpine arranque (importar los módulos y luego cargar Alpine, o usar `document.addEventListener('alpine:init', …)`).

## 2. Estructura de archivos

```
/
├─ index.html              # shell SPA: header, sidebar, <main> con plantilla de simulador
├─ css/theme.css           # mapeo de tokens Modernist sobre variables de Pico
├─ js/
│  ├─ app.js               # Alpine.data('simulab'), routing por hash, persistencia
│  ├─ catalog.js           # metadatos de los 8 simuladores (textos + params) — copiar de SIMS
│  ├─ chart.js             # wrapper de Chart.js (crear/actualizar sin recrear)
│  ├─ lib/random.js        # mulberry32, gauss (Box–Muller), poisson (Knuth)
│  ├─ lib/stats.js         # invNorm (Acklam), variance, format (es-MX)
│  └─ sims/
│     ├─ oferta.js  interes.js  eoq.js  rop.js
│     ├─ revision.js  bullwhip.js  beer.js  colas.js
│     └─ inventory.js      # simContinuous / simPeriodic compartidos
├─ tests/sims.test.js      # node --test, sin dependencias
└─ README.md
```

Cada módulo de `sims/` exporta una función pura: `run(params, seed) → { kpis, chart, lectura, bars? }`. Sin acceso al DOM. Así se prueban con `node --test`.

## 3. Sistema visual (Modernist sobre Pico)

El mockup usa el sistema **Modernist**: plano, arquitectónico, todo en Archivo, rojo único sobre blanco, **radio 0** y reglas de 2 px.

`css/theme.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;800&display=swap');
:root, [data-theme=light] {
  --pico-font-family: "Archivo", system-ui, sans-serif;
  --pico-background-color: #f3f2f2;
  --pico-color: #201e1d;
  --pico-primary: #ec3013;
  --pico-primary-background: #ec3013;
  --pico-primary-hover-background: #dd2b0f;
  --pico-primary-focus: rgba(236,48,19,.3);
  --pico-border-radius: 0;
  --pico-form-element-background-color: #eae9e9;
  --pico-card-background-color: #eae9e9;
  --pico-muted-color: #605d5d;
  --rule: color-mix(in srgb, #201e1d 40%, transparent);
}
input[type=range] { accent-color: #ec3013; }
h1,h2,h3,h4 { font-weight: 800; letter-spacing: -0.015em; }
```
Modo oscuro (Pico automático): definir `@media (prefers-color-scheme: dark) { :root:not([data-theme]) { … } }` con fondo `#2d2b2b`, texto `#f8f4f4`, acento `#ff563c`. Mantener radio 0.

Reglas: alineación a la izquierda (también dentro de botones), separadores de 2 px entre secciones, acento solo para la acción principal y la serie destacada de cada gráfica, sin sombras decorativas, sin esquinas redondeadas.

Paleta de series en gráficas (usar en Chart.js):
- `ink` #201e1d · `accent` #ec3013 · `n500` #9b9797 (discontinua) · `n700` #605d5d · `a400` #ff9783

## 4. Layout (ver mockup)

1. **Header** (`.nav`): marca "SimuLab" + subtítulo, etiqueta "8 simuladores · gratuito". Borde inferior 2 px.
2. **Sidebar** (240–300 px, borde derecho 2 px): grupos *Economía y finanzas* (01–02), *Inventarios* (03–05), *Cadena de suministro* (06–07), *Servicios* (08). Ítem activo: fondo acento, texto claro. En móvil el sidebar pasa arriba (flex-wrap).
3. **Cabecera del simulador**: kicker "Simulador NN · Grupo", H1, resumen de una línea, bloque "Modelo" con la fórmula en monoespaciada.
4. **Cuerpo** (dos columnas que se apilan < ~800 px):
   - Izquierda — *Parámetros*: por parámetro, etiqueta + valor formateado, slider (o control segmentado), y descripción corta debajo. Si es estocástico: bloque *Semilla* con botón "Nueva semilla". Al final: "Restablecer valores".
   - Derecha — fila de **KPIs** (regla superior 2 px, etiqueta en versalitas, valor 28 px/800, unidad), **gráfica** sobre `--surface` con título y leyenda, **barras de utilización** (solo colas) y **Lectura del escenario** (frase dinámica generada por `run`).
5. **Explicación** (3 columnas): *Qué simula*, *Efectos que observarás*, *Utilidad en los negocios*.
6. **Footer**: aviso de que los parámetros se guardan en el navegador.

## 5. Contrato de datos

```js
// catalog.js
{ id, num, group, title, short, formula, que, efectos: [], utilidad: [], stochastic,
  params: [{ key, label, min, max, step, def, dec?, pre?, unit?, desc, type?: 'seg', opts?: [[label, value]] }] }

// sims/*.js
run(v, seed) => {
  chartTitle, xLabel, yLabel,
  chart: { series: [{ name, color, dash?, data: [[x,y]] }], xMin?, xMax?, yMin?, yMax?,
           hLines?: [{ y, label, color }], vLines?: [{ x, label, color }], markers?: [{ x, y, label?, small? }] },
  kpis: [{ label, value: string, unit: string }],
  lectura: string,
  bars?: [{ name, w: 0-100, color, txt }]
}
```
En Chart.js: `type: 'line'` (o `'scatter'` con `showLine: true` para oferta/demanda y EOQ, que tienen eje X numérico). `hLines`/`vLines`/`markers` → datasets adicionales (línea de 2 puntos con `borderDash`) o el plugin `chartjs-plugin-annotation` si se prefiere. Actualizar con `chart.data = …; chart.update('none')` al mover sliders (sin recrear el canvas); animación solo al cambiar de simulador o semilla.

Formato numérico: `toLocaleString('es-MX')`, moneda con prefijo `$`.

## 6. Simuladores — lógica

Los rangos y valores por defecto exactos están en `SIMS`. Resumen:

### 01 Oferta y demanda (determinista)
Params: `a` 120, `b` 2, `c` 10, `d` 1.5, `t` 0.
`Qd = a − bP`, `Qs = c + d(P − t)`. `P* = (a − c + d·t)/(b + d)`, `Q* = máx(0, a − bP*)`.
Series en plano (Q, P): demanda `[(0, a/b), (a, 0)]`; oferta `P = (Q − c)/d + t`; si `t > 0`, oferta sin impuesto discontinua. Marcador en equilibrio.
KPIs: precio, cantidad, excedente del consumidor `½·Q*·(a/b − P*)`, recaudación `t·Q*`. Lectura: % del impuesto absorbido por el consumidor `(P* − P₀)/t`.

### 02 Interés compuesto (determinista)
Params: `P0` 10 000, `A` 200/mes, `r` 8 %, `Y` 20 años, `n` ∈ {1, 4, 12, 365} (segmentado), `inf` 3 %.
Bucle mensual con tasa efectiva `rm = (1 + r/n)^(n/12) − 1`: `bal = bal·(1+rm) + A`. Interés simple: interés mensual solo sobre capital aportado. Puntos anuales.
KPIs: valor final, total aportado, intereses, valor real `bal/(1+inf)^Y`. Lectura incluye regla del 72.

### 03 EOQ (determinista)
Params: `D` 12 000, `S` 100, `H` 2.5, `Qa` 1 500.
`Q* = √(2DS/H)`, `CT(Q) = D/Q·S + Q/2·H`. Curvas para Q ∈ [0.04, 1]·máx(3Q*, 1.3Qa), 80 puntos. Líneas verticales en Q* y Qa. `yMax = 2.6·CT(Q*)`.
KPIs: Q*, pedidos/año (y días entre pedidos `365Q*/D`), CT(Q*), sobrecosto `CT(Qa)/CT(Q*) − 1`.

### 04 Punto de reorden (estocástico, 180 días)
Params: `mu` 20, `sigma` 6, `L` 5, `sl` 95 %, `Q` 300.
`z = invNorm(sl)`, `SS = z·σ·√L`, `ROP = μL + SS`. Demanda diaria `máx(0, round(μ + σ·N(0,1)))` con semilla.
`simContinuous`: inventario inicial `Q + SS`; cada día: recibir pedidos con `arr === t`, atender `mín(inv, d)` (ventas perdidas, sin backlog), si posición (inv + en tránsito) ≤ ROP pedir Q con llegada `t + L`.
KPIs: ROP, SS (con z), servicio real (fill rate), días con faltante, inventario promedio. Marcadores rojos pequeños en días con faltante.

### 05 Revisión continua vs. periódica (estocástico, 120 días)
Params: `mu` 20, `sigma` 6, `L` 4, `T` 10, `Q` 200, `sl` 95 %.
Misma serie de demanda para ambos. Continua: igual que 04 con `R = μL + zσ√L`. Periódica (`simPeriodic`): inventario inicial S; si `t % T === 0`, pedir `S − posición` con `S = μ(T+L) + zσ√(T+L)`.
KPIs: inventario promedio, servicio y nº de pedidos de cada sistema.

### 06 Efecto látigo (estocástico, 52 semanas)
Params: `mu` 20, `sigma` 4, `L` 2, `alpha` 0.3.
4 eslabones en serie; la entrada de cada uno es la salida del anterior. Por eslabón: `F = αD + (1−α)F`, `S = F(L+1)`, `O = máx(0, D + S − S_prev)`. Inicial `F = μ`.
KPIs: `Var(órdenes)/Var(demanda)` por eslabón. Si σ = 0 mostrar ×1,0.

### 07 Beer Game simplificado (determinista, 36 semanas)
Params: `d2` 8, `D` (retraso) 2, `beta` 0.4, `theta` 0.2, `target` 12.
Estado inicial: inventario 12 por rol, tránsito precargado con 4 por semana en las primeras D semanas, pronóstico E = 4. Demanda del cliente 4 hasta la semana 4, luego `d2`.
Cada semana, para i = 0 (minorista) … 3 (fábrica), en orden:
1. `inv += llegadas[i][t]`
2. demanda `d` = cliente (i=0) o pedido de esta semana del rol i−1
3. `envío = mín(inv, d + backlog)`; actualizar inv y backlog; si i>0, `llegadas[i−1][t+D] += envío`
4. `E = 0.25d + 0.75E`; `SL = Σ llegadas[i][t+1..t+D]`
5. `pedido = máx(0, round(E + β·((S* − (inv − backlog)) + θ·(E·D − SL))))`; la fábrica produce: `llegadas[3][t+D] += pedido`
6. costo `+= 0.5·inv + 1·backlog`
Gráfica: inventario neto por rol, línea en 0 y vertical en semana 5. KPIs: costo total y por rol (con pico de pedido).
*Fase 2 opcional:* modo jugador donde el usuario decide los pedidos del minorista semana a semana.

### 08 Colas y cuellos de botella (estocástico, 480 min)
Params: `lam` 18/h, `mu` 7/h, `c` 3, `cap1` 30/h, `cap3` 24/h.
Analítico M/M/c: `a = λ/μ`, `ρ = λ/(cμ)`; si ρ < 1: Erlang C `Pw = [aᶜ/(c!(1−ρ))] / [Σₖ₌₀^{c−1} aᵏ/k! + aᶜ/(c!(1−ρ))]`, `Lq = Pw·ρ/(1−ρ)`, `Wq = Lq/λ`, `W = Wq + 1/μ` (mostrar en minutos). Si ρ ≥ 1: "∞" y "sistema inestable".
Simulación por minuto: llegadas `poisson(λ/60)`; c servidores con tiempo restante; al liberarse toman de la cola con duración `−ln(1−u)·60/μ`. Registrar cola cada 2 min. Línea horizontal en Lq teórica.
Barras: utilización `λ/capacidad` de Recepción (cap1), Atención (c·μ) y Cobro (cap3); la de menor capacidad en acento = cuello de botella. Throughput = `mín(λ, capacidades)`.

## 7. Utilidades

```js
export function mulberry32(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
export const gauss = r => { let u=0; while(u===0) u=r(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*r()); };
export const poisson = (r,l) => { const L=Math.exp(-l); let k=0,p=1; do{k++;p*=r();}while(p>L); return k-1; };
```
`invNorm`: aproximación racional de Acklam (copiar del mockup).

## 8. Estado y persistencia

Alpine: `x-data="simulab()"` con `{ sim, vals: {id: {key: val}}, seeds: {id: n} }`.
- Al cargar: leer `localStorage['simulab:v1']` y mezclar sobre los valores por defecto (tolerar claves nuevas o faltantes).
- `$watch` profundo → guardar JSON. Ruta `#/<id>` sincronizada con `sim`.
- Semilla por defecto 42; "Nueva semilla" = entero aleatorio 1–99 999; "Restablecer" vuelve a defaults y semilla 42.
- Recalcular `run()` en cada `input` del slider (todas las simulaciones son < 5 ms).

## 9. Accesibilidad

`<label for>` en cada slider, `aria-valuetext` con el valor formateado, canvas con `role="img"` y `aria-label` que incluya la lectura del escenario, foco visible 2 px acento, contraste ≥ 4.5:1 (texto en acento: usar #ae1800).

## 10. Pruebas mínimas (`node --test`)

- EOQ: D=12000, S=100, H=2.5 → Q* ≈ 979,8.
- Oferta: a=120,b=2,c=10,d=1.5,t=0 → P* ≈ 31,43, Q* ≈ 57,14.
- M/M/1 (c=1, λ=5, μ=10): Lq = 0,5; Wq = 0,1 h.
- Bullwhip con σ=0 → todas las razones = 1.
- Misma semilla → misma serie; semilla distinta → serie distinta.

## 11. Despliegue en Cloudflare Pages

1. Repositorio GitHub con la estructura anterior (sin build).
2. Cloudflare Pages → *Create project* → conectar el repo.
3. Framework preset: **None**; build command: vacío; output directory: `/`.
4. Cada push a `main` publica en `https://<proyecto>.pages.dev`.

## 12. Registro de cambios del diseño

| Fecha | Cambio | Archivos afectados |
|---|---|---|
| 2026-10-11 | Versión inicial: 8 simuladores, layout sidebar + parámetros + KPIs + gráfica + explicación | `SimuLab.dc.html`, este README |
| 2026-10-11 | Implementación SimulacionEcoWeb. Accesibilidad: ítem activo del sidebar y opción segmentada usan `--color-accent-600` con texto blanco (contraste ≥ 4,5:1); kicker, etiqueta y botón fantasma usan `--color-accent-700` como texto | `css/theme.css` |

*Al modificar el diseño: actualizar esta tabla, la sección 6 del simulador afectado y el `catalog.js` correspondiente.*
