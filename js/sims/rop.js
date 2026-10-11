import { C } from '../lib/colors.js';
import { demandStream } from '../lib/random.js';
import { fmt, invNorm } from '../lib/stats.js';
import { simContinuous } from './inventory.js';

// 04 · Punto de reorden con demanda variable (estocástico, 180 días).
export function run(v, seed) {
  const { mu, sigma, L, Q } = v;
  const z = invNorm(v.sl / 100), SS = z * sigma * Math.sqrt(L), ROP = mu * L + SS;
  const dem = demandStream(seed, 180, mu, sigma);
  const r = simContinuous(dem, L, ROP, Q, Q + SS);
  return {
    chartTitle: 'Inventario disponible por día', xLabel: 'Día', yLabel: 'Unidades',
    chart: {
      series: [{ name: 'Inventario', color: C.ink, data: r.s }],
      yMin: 0, xMin: 0, xMax: 179,
      hLines: [{ y: ROP, label: 'Punto de reorden', color: C.acc }, { y: SS, label: 'Stock de seguridad', color: C.n7 }],
      markers: r.outs.map(t => ({ x: t, y: 0, small: true }))
    },
    kpis: [
      { label: 'Punto de reorden', value: fmt(ROP), unit: 'unidades' },
      { label: 'Stock de seguridad', value: fmt(SS), unit: `z = ${fmt(z, 2)}` },
      { label: 'Servicio real', value: fmt(r.fill * 100, 1) + '%', unit: 'demanda atendida' },
      { label: 'Días con faltante', value: fmt(r.stockDays), unit: 'de 180' },
      { label: 'Inventario promedio', value: fmt(r.avg), unit: 'unidades' }
    ],
    lectura: `Con ${fmt(SS)} unidades de stock de seguridad se atendió el ${fmt(r.fill * 100, 1)}% de la demanda y hubo ${r.stockDays} días con faltante en ${r.orders} ciclos de pedido. Cambia la semilla para ver otro escenario con los mismos parámetros.`,
    raw: { dem, ROP, SS, z, fill: r.fill }
  };
}
