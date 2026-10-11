import { C } from '../lib/colors.js';
import { fmt, money } from '../lib/stats.js';

// 02 · Interés compuesto (determinista). Bucle mensual con tasa efectiva.
export function run(v) {
  const { P0, A, Y, n } = v, r = v.r / 100, inf = v.inf / 100;
  const rm = Math.pow(1 + r / n, n / 12) - 1;
  let bal = P0, prin = P0, simpleInt = 0;
  const comp = [[0, P0]], simp = [[0, P0]], ap = [[0, P0]];
  for (let m = 1; m <= Y * 12; m++) {
    simpleInt += prin * r / 12;
    bal = bal * (1 + rm) + A;
    prin += A;
    if (m % 12 === 0) { comp.push([m / 12, bal]); simp.push([m / 12, prin + simpleInt]); ap.push([m / 12, prin]); }
  }
  const real = bal / Math.pow(1 + inf, Y), simpleEnd = prin + simpleInt;
  return {
    chartTitle: 'Saldo acumulado por año', xLabel: 'Años', yLabel: 'Saldo ($)',
    chart: {
      series: [
        { name: 'Interés compuesto', color: C.acc, data: comp },
        { name: 'Interés simple', color: C.n5, dash: true, data: simp },
        { name: 'Total aportado', color: C.ink, data: ap }
      ],
      yMin: 0
    },
    kpis: [
      { label: 'Valor final', value: money(bal), unit: 'nominal' },
      { label: 'Total aportado', value: money(prin), unit: 'capital + aportes' },
      { label: 'Intereses ganados', value: money(bal - prin), unit: `${fmt((bal - prin) / Math.max(bal, 1) * 100)}% del saldo` },
      { label: 'Valor real', value: money(real), unit: 'en dinero de hoy' }
    ],
    lectura: `Con interés compuesto terminas con ${money(bal)}, ${money(bal - simpleEnd)} más que con interés simple. ${r > 0 ? `A ${fmt(v.r, 2)}% anual el dinero se duplica cada ${fmt(72 / v.r, 1)} años (regla del 72).` : ''} Descontando la inflación, el saldo equivale a ${money(real)} de hoy.`.replace(/\s+/g, ' ').trim(),
    raw: { bal, prin, real, simpleEnd }
  };
}
