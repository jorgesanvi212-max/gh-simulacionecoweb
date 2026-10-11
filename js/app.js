// SimulacionEcoWeb — componente Alpine principal: estado, routing por hash,
// persistencia en localStorage y enlace con las funciones run() de cada simulador.
import Alpine from 'https://cdn.jsdelivr.net/npm/alpinejs@3.14.9/dist/module.esm.js';
import { SIMS, DEFAULT_SEED, defaults, groups, displayParam } from './catalog.js';
import { LS, loadState } from './state.js';
import { renderChart } from './chart.js';

const byId = id => SIMS.find(s => s.id === id);
const hashId = () => {
  const m = /^#\/([\w-]+)/.exec(location.hash);
  return m && byId(m[1]) ? m[1] : null;
};

function simulab() {
  const st = loadState();
  let lastKey = null, lastRes = null;
  return {
    ...st,
    groups: groups(),
    res: null,

    init() {
      const h = hashId();
      if (h) this.sim = h; else history.replaceState(null, '', '#/' + this.sim);
      window.addEventListener('hashchange', () => { const id = hashId(); if (id && id !== this.sim) this.sim = id; });
      this.$watch('sim', id => { if (hashId() !== id) location.hash = '#/' + id; });
      // Redibujar con los colores del tema si cambia el modo claro/oscuro.
      matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (lastRes) renderChart(this.$refs.canvas, lastRes, { animate: false });
      });
    },

    get cur() { return byId(this.sim) || SIMS[0]; },
    get seed() { return this.seeds[this.cur.id]; },

    // Se ejecuta en x-effect: recalcula al cambiar simulador, parámetros o semilla.
    recompute() {
      const sim = this.cur, v = { ...this.vals[sim.id] }, seed = this.seeds[sim.id];
      try { localStorage.setItem(LS, JSON.stringify({ sim: this.sim, vals: this.vals, seeds: this.seeds })); } catch (e) { /* sin almacenamiento */ }
      const r = sim.run(v, seed);
      const key = sim.id + ':' + seed, animate = key !== lastKey;
      lastKey = key; lastRes = r;
      this.res = Object.freeze({
        kpis: r.kpis, lectura: r.lectura, chartTitle: r.chartTitle,
        legend: r.chart.series.map(s => ({ name: s.name, color: s.color }))
          .concat((r.chart.hLines || []).filter(l => l.label).map(l => ({ name: l.label, color: l.color }))),
        bars: r.bars || []
      });
      const canvas = this.$refs.canvas;
      if (canvas && window.Chart) renderChart(canvas, r, { animate });
    },

    display(p) { return displayParam(p, this.vals[this.cur.id][p.key]); },
    setP(key, val) { this.vals[this.cur.id][key] = val; },
    go(id) { this.sim = id; },
    newSeed() { this.seeds[this.cur.id] = Math.floor(Math.random() * 99999) + 1; },
    reset() {
      const id = this.cur.id;
      this.vals[id] = defaults()[id];
      this.seeds[id] = DEFAULT_SEED;
    }
  };
}

Alpine.data('simulab', simulab);
window.Alpine = Alpine;
Alpine.start();
