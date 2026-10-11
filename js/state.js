// Estado persistido en localStorage (clave simulab:v1).
import { SIMS, DEFAULT_SEED, defaults } from './catalog.js';

export const LS = 'simulab:v1';
const byId = id => SIMS.find(s => s.id === id);

// Defaults + lo guardado (tolera claves nuevas, faltantes o inválidas).
export function loadState(storage = globalThis.localStorage) {
  const base = { sim: SIMS[0].id, vals: defaults(), seeds: Object.fromEntries(SIMS.map(s => [s.id, DEFAULT_SEED])) };
  try {
    const saved = JSON.parse(storage?.getItem(LS) || 'null');
    if (saved && typeof saved === 'object') {
      if (byId(saved.sim)) base.sim = saved.sim;
      SIMS.forEach(s => {
        s.params.forEach(p => {
          const v = saved.vals?.[s.id]?.[p.key];
          const ok = p.type === 'seg' ? p.opts.some(o => o[1] === v) : Number.isFinite(v) && v >= p.min && v <= p.max;
          if (ok) base.vals[s.id][p.key] = v;
        });
        const sd = saved.seeds?.[s.id];
        if (Number.isInteger(sd) && sd > 0) base.seeds[s.id] = sd;
      });
    }
  } catch (e) { /* almacenamiento no disponible o JSON corrupto: usar defaults */ }
  return base;
}
