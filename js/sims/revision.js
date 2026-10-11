import { C } from '../lib/colors.js';
import { demandStream } from '../lib/random.js';
import { fmt, invNorm } from '../lib/stats.js';
import { simContinuous, simPeriodic } from './inventory.js';

// 05 · Revisión continua vs. periódica (estocástico, 120 días, misma demanda).
export function run(v, seed) {
  const { mu, sigma, L, T, Q } = v, z = invNorm(v.sl / 100);
  const R = mu * L + z * sigma * Math.sqrt(L), S = mu * (T + L) + z * sigma * Math.sqrt(T + L);
  const dem = demandStream(seed, 120, mu, sigma);
  const a = simContinuous(dem, L, R, Q, Q + z * sigma * Math.sqrt(L)), b = simPeriodic(dem, L, T, S);
  return {
    chartTitle: 'Inventario disponible — misma demanda, dos políticas', xLabel: 'Día', yLabel: 'Unidades',
    chart: {
      series: [
        { name: 'Revisión continua (Q, R)', color: C.ink, data: a.s },
        { name: 'Revisión periódica (T, S)', color: C.acc, data: b.s }
      ],
      yMin: 0, xMin: 0, xMax: 119
    },
    kpis: [
      { label: 'Continua · inv. prom.', value: fmt(a.avg), unit: `R = ${fmt(R)} unid.` },
      { label: 'Periódica · inv. prom.', value: fmt(b.avg), unit: `S = ${fmt(S)} unid.` },
      { label: 'Continua · servicio', value: fmt(a.fill * 100, 1) + '%', unit: `${a.orders} pedidos` },
      { label: 'Periódica · servicio', value: fmt(b.fill * 100, 1) + '%', unit: `${b.orders} pedidos` }
    ],
    lectura: `Revisando cada ${T} días, el sistema periódico mantiene en promedio ${fmt(b.avg)} unidades frente a ${fmt(a.avg)} del continuo (${fmt((b.avg / Math.max(a.avg, 1) - 1) * 100)}% ${b.avg >= a.avg ? 'más' : 'menos'}), con servicio de ${fmt(b.fill * 100, 1)}% contra ${fmt(a.fill * 100, 1)}%.`,
    raw: { R, S, a, b }
  };
}
