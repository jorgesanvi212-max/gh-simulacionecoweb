import { C } from '../lib/colors.js';
import { fmt, money } from '../lib/stats.js';

// 03 · Cantidad económica de pedido (determinista).
export function run(v) {
  const { D, S, H, Qa } = v;
  const Qs = Math.sqrt(2 * D * S / H), ct = q => D / q * S + q / 2 * H;
  const qmax = Math.max(3 * Qs, Qa * 1.3), tot = [], ord = [], hold = [];
  for (let i = 1; i <= 80; i++) {
    const q = qmax * (0.04 + 0.96 * i / 80);
    tot.push([q, ct(q)]); ord.push([q, D / q * S]); hold.push([q, q / 2 * H]);
  }
  const extra = (ct(Qa) / ct(Qs) - 1) * 100;
  return {
    chartTitle: 'Costo anual según el tamaño de pedido', xLabel: 'Tamaño de pedido (Q)', yLabel: 'Costo anual ($)',
    chart: {
      series: [
        { name: 'Costo total', color: C.acc, data: tot },
        { name: 'Costo de pedir', color: C.ink, data: ord },
        { name: 'Costo de mantener', color: C.n5, dash: true, data: hold }
      ],
      xMin: 0, yMin: 0, yMax: ct(Qs) * 2.6,
      vLines: [{ x: Qs, label: 'EOQ', color: C.acc }, { x: Qa, label: 'Actual', color: C.ink }],
      markers: [{ x: Qs, y: ct(Qs) }]
    },
    kpis: [
      { label: 'EOQ (Q*)', value: fmt(Qs), unit: 'unidades por pedido' },
      { label: 'Pedidos al año', value: fmt(D / Qs, 1), unit: `cada ${fmt(365 * Qs / D)} días` },
      { label: 'Costo total en Q*', value: money(ct(Qs)), unit: 'por año' },
      { label: 'Sobrecosto actual', value: '+' + fmt(extra, 1) + '%', unit: money(ct(Qa) - ct(Qs)) + ' por año' }
    ],
    lectura: Math.abs(extra) < 2
      ? `Tu política actual (${fmt(Qa)} unid.) está prácticamente en el óptimo.`
      : `Pedir ${fmt(Qa)} unidades cuesta ${money(ct(Qa))} al año; con lotes de ${fmt(Qs)} unidades ahorrarías ${money(ct(Qa) - ct(Qs))} (${fmt(extra, 1)}%).`,
    raw: { Qs, ct: ct(Qs), extra }
  };
}
