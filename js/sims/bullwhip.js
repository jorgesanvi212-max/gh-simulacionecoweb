import { C } from '../lib/colors.js';
import { demandStream } from '../lib/random.js';
import { fmt, variance } from '../lib/stats.js';

const NAMES = ['Minorista', 'Mayorista', 'Distribuidor', 'Fábrica'];

// 06 · Efecto látigo (estocástico, 52 semanas, 4 eslabones en serie).
export function run(v, seed) {
  const { mu, sigma, L, alpha } = v, N = 52, cols = [C.ink, C.n7, C.a4, C.acc];
  const dem = demandStream(seed, N, mu, sigma);
  let input = dem;
  const out = [];
  NAMES.forEach(() => {
    let F = mu, Sp = F * (L + 1);
    const o = input.map(D => {
      F = alpha * D + (1 - alpha) * F;
      const S = F * (L + 1), x = Math.max(0, D + S - Sp);
      Sp = S;
      return x;
    });
    out.push(o);
    input = o;
  });
  const vd = Math.max(variance(dem), 1e-9), ratios = out.map(o => variance(o) / vd);
  return {
    chartTitle: 'Pedidos semanales por eslabón', xLabel: 'Semana', yLabel: 'Unidades pedidas',
    chart: {
      series: [{ name: 'Demanda del cliente', color: C.n5, dash: true, data: dem.map((d, i) => [i + 1, d]) }]
        .concat(out.map((o, k) => ({ name: NAMES[k], color: cols[k], data: o.map((x, i) => [i + 1, x]) }))),
      yMin: 0
    },
    kpis: NAMES.map((n, k) => ({ label: n, value: sigma === 0 ? '×1,0' : '×' + fmt(ratios[k], 1), unit: 'varianza vs. cliente' })),
    lectura: sigma === 0
      ? 'Con demanda constante no hay nada que amplificar: todos los eslabones piden lo mismo que compra el cliente.'
      : `La fábrica enfrenta una variabilidad ${fmt(ratios[3], 1)} veces mayor que la del consumidor final, aunque la demanda real nunca cambió de promedio.`,
    raw: { ratios: sigma === 0 ? NAMES.map(() => 1) : ratios, dem, out }
  };
}
