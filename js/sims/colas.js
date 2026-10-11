import { C } from '../lib/colors.js';
import { mulberry32, poisson } from '../lib/random.js';
import { fmt } from '../lib/stats.js';

// Modelo analítico M/M/c (Erlang C). Tasas por hora; Wq y W en horas.
export function mmc(lam, mu, c) {
  const rho = lam / (c * mu), a = lam / mu;
  if (rho >= 1) return { rho, Pw: 1, Lq: Infinity, Wq: Infinity, W: Infinity };
  let sum = 0, f = 1;
  for (let k = 0; k < c; k++) { if (k > 0) f *= k; sum += Math.pow(a, k) / f; }
  // f = (c−1)!  →  c! = f·c
  const top = Math.pow(a, c) / (f * c) / (1 - rho);
  const Pw = top / (sum + top), Lq = Pw * rho / (1 - rho), Wq = Lq / lam;
  return { rho, Pw, Lq, Wq, W: Wq + 1 / mu };
}

// 08 · Colas y cuellos de botella (estocástico, jornada de 480 min).
export function run(v, seed) {
  const { lam, mu, c, cap1, cap3 } = v;
  const { rho, Pw, Lq } = mmc(lam, mu, c);
  const Wq = Lq / lam * 60, W = Wq + 60 / mu;
  const r = mulberry32(seed), srv = Array(c).fill(0), q = [];
  let qn = 0;
  for (let m = 0; m < 480; m++) {
    qn += poisson(r, lam / 60);
    for (let s = 0; s < c; s++) {
      if (srv[s] > 0) srv[s]--;
      if (srv[s] <= 0 && qn > 0) { qn--; srv[s] = -Math.log(1 - r()) * 60 / mu; }
    }
    if (m % 2 === 0) q.push([m, qn]);
  }
  const stages = [['Recepción', cap1], ['Atención (c·μ)', c * mu], ['Cobro', cap3]];
  const minCap = Math.min(...stages.map(s => s[1]));
  const bn = stages.find(s => s[1] === minCap)[0];
  return {
    chartTitle: 'Personas en cola durante la jornada (simulación)', xLabel: 'Minuto de la jornada', yLabel: 'En cola',
    chart: {
      series: [{ name: 'Cola simulada', color: C.ink, data: q }],
      yMin: 0, xMin: 0, xMax: 480,
      hLines: isFinite(Lq) ? [{ y: Lq, label: 'Lq teórica', color: C.acc }] : []
    },
    bars: stages.map(([n, cap]) => ({
      name: n, w: Math.min(100, lam / cap * 100),
      color: cap === minCap ? 'var(--color-accent)' : 'var(--color-text)',
      txt: `${fmt(lam / cap * 100)}% · ${fmt(cap)}/h`
    })),
    kpis: [
      { label: 'Utilización (ρ)', value: fmt(rho * 100) + '%', unit: rho >= 1 ? 'sistema inestable' : 'de los servidores' },
      { label: 'En cola (Lq)', value: fmt(Lq, 1), unit: 'clientes promedio' },
      { label: 'Espera (Wq)', value: fmt(Wq, 1), unit: 'minutos en cola' },
      { label: 'Tiempo total (W)', value: fmt(W, 1), unit: 'minutos en el sistema' },
      { label: 'Prob. de esperar', value: fmt(Pw * 100) + '%', unit: 'Erlang C' }
    ],
    lectura: `${rho >= 1 ? 'La atención no alcanza a cubrir las llegadas: la cola crece sin límite. ' : `Cada cliente espera en promedio ${fmt(Wq, 1)} minutos. `}El cuello de botella es ${bn} con ${fmt(minCap)} clientes/h; el proceso completo puede despachar como máximo ${fmt(Math.min(lam, minCap))} clientes por hora.`,
    raw: { rho, Pw, Lq, q }
  };
}
