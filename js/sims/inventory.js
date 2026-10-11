// Simulaciones de inventario compartidas por los simuladores 04 y 05.
// Ventas perdidas (sin backlog); los pedidos llegan L días después.

// Revisión continua (Q, R): pide Q cuando la posición (inv + tránsito) ≤ ROP.
export function simContinuous(dem, L, ROP, Q, init) {
  let inv = init, pipe = [], served = 0, asked = 0, stockDays = 0, orders = 0, sum = 0;
  const s = [], outs = [];
  dem.forEach((d, t) => {
    pipe = pipe.filter(o => (o.arr === t ? ((inv += o.q), false) : true));
    const sv = Math.min(inv, d);
    inv -= sv; served += sv; asked += d;
    if (sv < d) { stockDays++; outs.push(t); }
    const pos = inv + pipe.reduce((a, o) => a + o.q, 0);
    if (pos <= ROP) { pipe.push({ arr: t + L, q: Q }); orders++; }
    s.push([t, inv]); sum += inv;
  });
  return { s, outs, fill: asked ? served / asked : 1, stockDays, orders, avg: sum / dem.length };
}

// Revisión periódica (T, S): cada T días pide lo necesario para volver a S.
export function simPeriodic(dem, L, T, S) {
  let inv = S, pipe = [], served = 0, asked = 0, stockDays = 0, orders = 0, sum = 0;
  const s = [];
  dem.forEach((d, t) => {
    pipe = pipe.filter(o => (o.arr === t ? ((inv += o.q), false) : true));
    const sv = Math.min(inv, d);
    inv -= sv; served += sv; asked += d;
    if (sv < d) stockDays++;
    if (t % T === 0) {
      const q = S - (inv + pipe.reduce((a, o) => a + o.q, 0));
      if (q > 0) { pipe.push({ arr: t + L, q }); orders++; }
    }
    s.push([t, inv]); sum += inv;
  });
  return { s, fill: asked ? served / asked : 1, stockDays, orders, avg: sum / dem.length };
}
