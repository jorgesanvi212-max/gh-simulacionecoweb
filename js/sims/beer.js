import { C } from '../lib/colors.js';
import { money } from '../lib/stats.js';

const NAMES = ['Minorista', 'Mayorista', 'Distribuidor', 'Fábrica'];

// 07 · Beer Game simplificado (determinista, 36 semanas).
export function run(v) {
  const { d2, D, beta, theta, target } = v, N = 36, R = 4, cols = [C.ink, C.n7, C.a4, C.acc];
  const inv = Array(R).fill(12), back = Array(R).fill(0), E = Array(R).fill(4);
  const cost = Array(R).fill(0), peak = Array(R).fill(0);
  const arr = NAMES.map(() => Array(N + D + 2).fill(0)), net = NAMES.map(() => []);
  // Tránsito precargado: 4 cajas por semana durante las primeras D semanas.
  arr.forEach(a => { for (let k = 0; k < D; k++) a[k] = 4; });
  for (let t = 0; t < N; t++) {
    const cur = Array(R).fill(0);
    for (let i = 0; i < R; i++) {
      inv[i] += arr[i][t];
      const d = i === 0 ? (t < 4 ? 4 : d2) : cur[i - 1];
      const need = d + back[i], ship = Math.min(inv[i], need);
      inv[i] -= ship; back[i] = need - ship;
      if (i > 0) arr[i - 1][t + D] += ship;
      E[i] = 0.25 * d + 0.75 * E[i];
      let SL = 0;
      for (let k = t + 1; k <= t + D; k++) SL += arr[i][k];
      const o = Math.max(0, Math.round(E[i] + beta * ((target - (inv[i] - back[i])) + theta * (E[i] * D - SL))));
      cur[i] = o; peak[i] = Math.max(peak[i], o);
      if (i === R - 1) arr[i][t + D] += o;
      cost[i] += 0.5 * inv[i] + back[i];
      net[i].push([t + 1, inv[i] - back[i]]);
    }
  }
  const total = cost.reduce((s, x) => s + x, 0);
  return {
    chartTitle: 'Inventario neto por rol (negativo = pedidos pendientes)', xLabel: 'Semana', yLabel: 'Cajas',
    chart: {
      series: net.map((s, k) => ({ name: NAMES[k], color: cols[k], data: s })),
      hLines: [{ y: 0, label: '', color: C.ink }],
      vLines: [{ x: 5, label: 'Escalón', color: C.n7 }]
    },
    kpis: [{ label: 'Costo total cadena', value: money(total), unit: `${N} semanas` }]
      .concat(NAMES.map((n, k) => ({ label: n, value: money(cost[k]), unit: `pico de pedido: ${peak[k]}` }))),
    lectura: `La demanda subió una sola vez de 4 a ${d2} cajas, pero la fábrica llegó a pedir ${peak[3]} cajas en una semana. ${theta < 0.5 ? 'Sube θ para que los roles cuenten lo que ya viene en camino y observa cómo bajan las oscilaciones y el costo.' : 'Con θ alto los roles consideran sus pedidos en tránsito y la cadena se estabiliza antes.'}`,
    raw: { total, cost, peak }
  };
}
