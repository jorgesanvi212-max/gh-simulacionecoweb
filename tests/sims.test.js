// Pruebas de los simuladores: node --test (sin dependencias).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SIMS, defaults, displayParam } from '../js/catalog.js';
import { mulberry32, demandStream, poisson } from '../js/lib/random.js';
import { invNorm, fmt } from '../js/lib/stats.js';
import { mmc } from '../js/sims/colas.js';
import { loadState, LS } from '../js/state.js';
import * as oferta from '../js/sims/oferta.js';
import * as eoq from '../js/sims/eoq.js';
import * as bullwhip from '../js/sims/bullwhip.js';
import * as rop from '../js/sims/rop.js';
import * as colas from '../js/sims/colas.js';

const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg ?? ''} ${a} ≉ ${b}`);
const D = defaults();

test('EOQ: D=12000, S=100, H=2.5 → Q* ≈ 979,8', () => {
  const r = eoq.run({ D: 12000, S: 100, H: 2.5, Qa: 1500 });
  close(r.raw.Qs, 979.8, 0.05);
  assert.equal(r.kpis[0].value, fmt(979.8));
});

test('Oferta: a=120, b=2, c=10, d=1.5, t=0 → P* ≈ 31,43, Q* ≈ 57,14', () => {
  const r = oferta.run({ a: 120, b: 2, c: 10, d: 1.5, t: 0 });
  close(r.raw.P, 31.43, 0.005);
  close(r.raw.Q, 57.14, 0.005);
});

test('Oferta: con impuesto el precio sube y la cantidad baja', () => {
  const r = oferta.run({ a: 120, b: 2, c: 10, d: 1.5, t: 5 });
  assert.ok(r.raw.P > r.raw.P0 && r.raw.Q < r.raw.Q0);
  assert.equal(r.chart.series.length, 3);
});

test('M/M/1 (c=1, λ=5, μ=10): Lq = 0,5; Wq = 0,1 h', () => {
  const m = mmc(5, 10, 1);
  close(m.Lq, 0.5, 1e-9);
  close(m.Wq, 0.1, 1e-9);
  close(m.rho, 0.5, 1e-12);
});

test('M/M/c inestable con ρ ≥ 1', () => {
  const m = mmc(30, 7, 3);
  assert.equal(m.Lq, Infinity);
  const r = colas.run({ ...D.colas, lam: 30 }, 42);
  assert.equal(r.kpis[0].unit, 'sistema inestable');
  assert.equal(r.chart.hLines.length, 0);
});

test('Colas: el cuello de botella es la etapa de menor capacidad', () => {
  const r = colas.run(D.colas, 42); // capacidades 30, 21, 24 → Atención
  assert.match(r.lectura, /Atención/);
  assert.equal(r.bars.filter(b => b.color === 'var(--color-accent)').length, 1);
});

test('Bullwhip con σ=0 → todas las razones = 1', () => {
  const r = bullwhip.run({ ...D.bullwhip, sigma: 0 }, 42);
  assert.deepEqual(r.raw.ratios, [1, 1, 1, 1]);
  r.kpis.forEach(k => assert.equal(k.value, '×1,0'));
  r.raw.out.forEach(o => o.forEach(x => close(x, 20, 1e-9)));
});

test('Bullwhip: la variabilidad crece aguas arriba', () => {
  const r = bullwhip.run(D.bullwhip, 42);
  const v = r.raw.ratios;
  assert.ok(v[0] > 1 && v[3] > v[0]);
});

test('Misma semilla → misma serie; semilla distinta → serie distinta', () => {
  assert.deepEqual(demandStream(42, 50, 20, 6), demandStream(42, 50, 20, 6));
  assert.notDeepEqual(demandStream(42, 50, 20, 6), demandStream(43, 50, 20, 6));
  assert.deepEqual(rop.run(D.rop, 7).raw.dem, rop.run(D.rop, 7).raw.dem);
  assert.notDeepEqual(rop.run(D.rop, 7).raw.dem, rop.run(D.rop, 8).raw.dem);
});

test('mulberry32 en [0,1) y poisson con media ≈ λ', () => {
  const r = mulberry32(1);
  let s = 0;
  for (let i = 0; i < 20000; i++) { const u = r(); assert.ok(u >= 0 && u < 1); }
  const r2 = mulberry32(2);
  for (let i = 0; i < 20000; i++) s += poisson(r2, 0.3);
  close(s / 20000, 0.3, 0.02);
});

test('invNorm: cuantiles conocidos', () => {
  close(invNorm(0.5), 0, 1e-9);
  close(invNorm(0.95), 1.6449, 1e-3);
  close(invNorm(0.995), 2.5758, 1e-3);
  close(invNorm(0.01), -2.3263, 1e-3);
});

test('ROP: SS = z·σ·√L y ROP = μL + SS', () => {
  const r = rop.run(D.rop, 42);
  close(r.raw.SS, 1.6449 * 6 * Math.sqrt(5), 0.02);
  close(r.raw.ROP, 100 + r.raw.SS, 1e-9);
  assert.ok(r.raw.fill > 0.8 && r.raw.fill <= 1);
});

test('Todos los simuladores corren en sus extremos sin NaN y en < 50 ms', () => {
  for (const s of SIMS) {
    const combos = [D[s.id],
      Object.fromEntries(s.params.map(p => [p.key, p.type === 'seg' ? p.opts[0][1] : p.min])),
      Object.fromEntries(s.params.map(p => [p.key, p.type === 'seg' ? p.opts.at(-1)[1] : p.max]))];
    for (const v of combos) {
      const t0 = performance.now();
      const r = s.run(v, 42);
      assert.ok(performance.now() - t0 < 50, `${s.id} lento`);
      assert.ok(r.kpis.length >= 4, s.id);
      assert.ok(typeof r.lectura === 'string' && r.lectura.length > 20 && !r.lectura.includes('NaN') && !r.lectura.includes('undefined'), `${s.id}: ${r.lectura}`);
      r.kpis.forEach(k => assert.ok(!String(k.value).includes('NaN'), `${s.id} ${k.label}`));
      r.chart.series.forEach(se => se.data.forEach(([x, y]) => assert.ok(Number.isFinite(x) && Number.isFinite(y), `${s.id} ${se.name}`)));
    }
  }
});

test('Catálogo: 8 simuladores, defaults dentro de rango y en la rejilla del paso', () => {
  assert.equal(SIMS.length, 8);
  assert.deepEqual(SIMS.map(s => s.num), ['01', '02', '03', '04', '05', '06', '07', '08']);
  for (const s of SIMS) for (const p of s.params) {
    if (p.type === 'seg') { assert.ok(p.opts.some(o => o[1] === p.def)); continue; }
    assert.ok(p.def >= p.min && p.def <= p.max, `${s.id}.${p.key}`);
    const k = (p.def - p.min) / p.step;
    close(k, Math.round(k), 1e-9, `${s.id}.${p.key} fuera del paso`);
  }
});

test('Formato de parámetros como en el mockup', () => {
  const H = SIMS.find(s => s.id === 'eoq').params.find(p => p.key === 'H');
  assert.equal(displayParam(H, 2.5), '$2.5/unid.·año');
  const r = SIMS.find(s => s.id === 'interes').params.find(p => p.key === 'r');
  assert.equal(displayParam(r, 8), '8.00%');
  const n = SIMS.find(s => s.id === 'interes').params.find(p => p.key === 'n');
  assert.equal(displayParam(n, 365), 'Diaria');
});

test('Persistencia: mezcla lo guardado sobre defaults y descarta valores inválidos', () => {
  const store = { getItem: k => (k === LS ? JSON.stringify({ sim: 'eoq', vals: { eoq: { D: 20000, S: 'x', H: 999 }, nuevo: { z: 1 } }, seeds: { rop: 777, colas: -1 } }) : null) };
  const st = loadState(store);
  assert.equal(st.sim, 'eoq');
  assert.equal(st.vals.eoq.D, 20000);
  assert.equal(st.vals.eoq.S, 100);
  assert.equal(st.vals.eoq.H, 2.5);
  assert.equal(st.seeds.rop, 777);
  assert.equal(st.seeds.colas, 42);
  assert.equal(loadState({ getItem: () => '{corrupto' }).sim, 'oferta');
  assert.equal(loadState(undefined).sim, 'oferta');
});
