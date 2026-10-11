// Wrapper de Chart.js: traduce el `chart` que devuelve cada run() a una
// gráfica de dispersión con líneas. Crea el canvas una sola vez y luego solo
// actualiza datos (sin recrear). hLines / vLines / markers se dibujan como
// datasets adicionales y sus etiquetas con un plugin propio.
import { fmt, tickFmt } from './lib/stats.js';

const root = () => getComputedStyle(document.documentElement);

// 'var(--token)' → color concreto (Chart.js dibuja en canvas, no entiende var()).
export function resolveColor(c) {
  const m = /^var\((--[^)]+)\)$/.exec(c || '');
  return m ? root().getPropertyValue(m[1]).trim() || '#000' : c;
}

// Marcas "redondas" en 1, 2, 5 × 10ⁿ — las mismas que usa el mockup.
export function nice(min, max, n) {
  const range = max - min || 1;
  let step = Math.pow(10, Math.floor(Math.log10(range / n)));
  const e = range / n / step;
  step *= e >= 7.5 ? 10 : e >= 3.5 ? 5 : e >= 1.5 ? 2 : 1;
  const out = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) out.push(+v.toFixed(10));
  return out;
}

// Mismos límites de ejes que el mockup.
function bounds(spec) {
  const pts = spec.series.flatMap(s => s.data), xs = pts.map(p => p[0]);
  const ys = pts.map(p => p[1]).concat((spec.hLines || []).map(l => l.y));
  const x0 = spec.xMin ?? Math.min(...xs), x1 = spec.xMax ?? Math.max(...xs);
  const y0 = spec.yMin ?? Math.min(0, ...ys);
  let y1 = spec.yMax ?? Math.max(...ys) * 1.08;
  if (y1 <= y0) y1 = y0 + 1;
  return { x0, x1: x1 > x0 ? x1 : x0 + 1, y0, y1 };
}

const pt = ([x, y]) => ({ x, y });

function datasets(spec, b) {
  const ds = spec.series.map(s => ({
    label: s.name, kind: 'series',
    data: s.data.map(pt),
    showLine: true, borderColor: resolveColor(s.color), backgroundColor: resolveColor(s.color),
    borderWidth: s.dash ? 1.5 : 2.25, borderDash: s.dash ? [5, 4] : [],
    borderJoinStyle: 'round', pointRadius: 0, pointHoverRadius: 3, pointHitRadius: 6, tension: 0
  }));
  const ref = (label, data, color) => ({
    label, kind: 'ref', data, showLine: true, borderColor: resolveColor(color),
    borderWidth: 1.5, borderDash: [6, 4], pointRadius: 0, pointHoverRadius: 0, pointHitRadius: 0
  });
  (spec.hLines || []).forEach(l => ds.push(ref(l.label, [{ x: b.x0, y: l.y }, { x: b.x1, y: l.y }], l.color)));
  (spec.vLines || []).forEach(l => ds.push(ref(l.label, [{ x: l.x, y: b.y0 }, { x: l.x, y: b.y1 }], l.color)));
  const markers = spec.markers || [];
  if (markers.length) {
    const acc = resolveColor('var(--color-accent)');
    ds.push({
      label: 'markers', kind: 'ref', data: markers.map(m => ({ x: m.x, y: m.y })), showLine: false,
      pointStyle: 'rect', backgroundColor: acc, borderColor: acc, borderWidth: 0,
      // En 'rect' el lado es radio·√2: 10 px normal, 5 px pequeño.
      pointRadius: markers.map(m => (m.small ? 5 : 10) / Math.SQRT2),
      pointHoverRadius: markers.map(m => (m.small ? 5 : 10) / Math.SQRT2),
      pointHitRadius: 0, clip: false
    });
  }
  return ds;
}

// Etiquetas de líneas de referencia y marcadores (como en el mockup).
const refLabels = {
  id: 'refLabels',
  afterDatasetsDraw(chart) {
    const spec = chart.$spec;
    if (!spec) return;
    const { ctx, chartArea: a, scales: { x, y } } = chart;
    const family = chart.options.font?.family || Chart.defaults.font.family;
    ctx.save();
    ctx.beginPath(); ctx.rect(a.left, a.top, a.right - a.left, a.bottom - a.top); ctx.clip();
    ctx.textBaseline = 'alphabetic';
    (spec.hLines || []).forEach(l => {
      if (!l.label) return;
      ctx.font = `700 11px ${family}`; ctx.fillStyle = resolveColor(l.color); ctx.textAlign = 'right';
      ctx.fillText(l.label, a.right - 4, y.getPixelForValue(l.y) - 6);
    });
    (spec.vLines || []).forEach((l, i) => {
      ctx.font = `700 11px ${family}`; ctx.fillStyle = resolveColor(l.color); ctx.textAlign = 'left';
      ctx.fillText(l.label, x.getPixelForValue(l.x) + 5, a.top + 12 + i * 14);
    });
    (spec.markers || []).forEach(m => {
      if (!m.label) return;
      ctx.font = `800 12px ${family}`; ctx.fillStyle = resolveColor('var(--color-text)'); ctx.textAlign = 'left';
      ctx.fillText(m.label, x.getPixelForValue(m.x) + 10, y.getPixelForValue(m.y) - 8);
    });
    ctx.restore();
  }
};

function theme() {
  return {
    text: resolveColor('var(--color-text)'),
    muted: resolveColor('var(--color-neutral-700)'),
    grid: resolveColor('var(--color-neutral-300)'),
    surface: resolveColor('var(--color-bg)')
  };
}

function options(spec, b, xLabel, yLabel) {
  const t = theme();
  const tick = { color: t.muted, font: { size: 11 }, padding: 6, callback: v => tickFmt(v) };
  const title = text => ({ display: true, text, align: 'end', color: t.muted, font: { size: 11, weight: 600 } });
  return {
    responsive: true, maintainAspectRatio: true, aspectRatio: 760 / 340,
    layout: { padding: { top: 8, right: 8 } },
    interaction: { mode: 'nearest', axis: 'x', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        filter: item => item.dataset.kind === 'series',
        backgroundColor: t.text, titleColor: t.surface, bodyColor: t.surface,
        cornerRadius: 0, displayColors: true, boxPadding: 4,
        titleFont: { weight: 700 },
        callbacks: {
          title: items => items.length ? `${xLabel}: ${fmt(items[0].parsed.x, Number.isInteger(items[0].parsed.x) ? 0 : 1)}` : '',
          label: item => ` ${item.dataset.label}: ${fmt(item.parsed.y, Math.abs(item.parsed.y) < 100 && !Number.isInteger(item.parsed.y) ? 1 : 0)}`
        }
      }
    },
    scales: {
      x: {
        type: 'linear', min: b.x0, max: b.x1,
        grid: { display: false }, border: { color: t.text, width: 2 },
        ticks: { ...tick, maxRotation: 0 }, title: title(xLabel),
        afterBuildTicks: s => { s.ticks = nice(b.x0, b.x1, 6).map(value => ({ value })); }
      },
      y: {
        type: 'linear', min: b.y0, max: b.y1,
        grid: { color: t.grid, lineWidth: 1, drawTicks: false }, border: { color: t.text, width: 2 },
        ticks: tick, title: title(yLabel),
        afterBuildTicks: s => { s.ticks = nice(b.y0, b.y1, 5).map(value => ({ value })); }
      }
    }
  };
}

// Crea la gráfica la primera vez y después solo la actualiza.
export function renderChart(canvas, res, { animate = false } = {}) {
  const spec = res.chart, b = bounds(spec);
  let chart = Chart.getChart(canvas);
  if (!chart) {
    Chart.defaults.font.family = '"Archivo", system-ui, sans-serif';
    chart = new Chart(canvas, { type: 'scatter', data: { datasets: [] }, options: {}, plugins: [refLabels] });
  }
  chart.$spec = spec;
  chart.data.datasets = datasets(spec, b);
  chart.options = options(spec, b, res.xLabel, res.yLabel);
  chart.update(animate ? undefined : 'none');
  return chart;
}
