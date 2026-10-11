import { C } from '../lib/colors.js';
import { fmt, money } from '../lib/stats.js';

// 01 · Oferta y demanda (determinista).
export function run(v) {
  const { a, b, c, d, t } = v;
  const P0 = (a - c) / (b + d), P = (a - c + d * t) / (b + d);
  const Q = Math.max(0, a - b * P), Q0 = Math.max(0, a - b * P0);
  const ymax = (a / b) * 1.05, q0 = Math.max(0, c - d * t);
  const series = [
    { name: 'Demanda', color: C.ink, data: [[0, a / b], [a, 0]] },
    { name: 'Oferta', color: C.acc, data: [[q0, (q0 - c) / d + t], [a, (a - c) / d + t]] }
  ];
  if (t > 0) series.push({ name: 'Oferta sin impuesto', color: C.n5, dash: true, data: [[c, 0], [a, (a - c) / d]] });
  return {
    chartTitle: 'Curvas de oferta y demanda', xLabel: 'Cantidad (Q)', yLabel: 'Precio (P)',
    chart: { series, xMin: 0, xMax: a, yMin: 0, yMax: ymax, markers: [{ x: Q, y: P, label: 'Equilibrio' }] },
    kpis: [
      { label: 'Precio de equilibrio', value: money(P, 2), unit: 'por unidad' },
      { label: 'Cantidad', value: fmt(Q, 1), unit: 'unidades' },
      { label: 'Excedente consumidor', value: money(0.5 * Q * (a / b - P)), unit: 'bienestar del comprador' },
      { label: 'Recaudación', value: money(t * Q), unit: 'impuesto × cantidad' }
    ],
    lectura: t > 0
      ? `El impuesto de $${t} sube el precio que paga el comprador de ${money(P0, 2)} a ${money(P, 2)} y reduce la cantidad transada en ${fmt(Q0 - Q, 1)} unidades. El consumidor absorbe el ${fmt((P - P0) / t * 100)}% del impuesto.`
      : `El mercado se equilibra en ${fmt(Q, 1)} unidades a ${money(P, 2)}. Agrega un impuesto o cambia la sensibilidad (b) para ver quién absorbe el cambio.`,
    // Valores numéricos para pruebas.
    raw: { P, Q, P0, Q0 }
  };
}
