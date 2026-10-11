// Generadores pseudoaleatorios con semilla (Math.random() no admite semilla).

export function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Normal estándar N(0,1) por Box–Muller.
export function gauss(r) {
  let u = 0;
  while (u === 0) u = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
}

// Poisson(l) por el método de Knuth.
export function poisson(r, l) {
  const L = Math.exp(-l);
  let k = 0, p = 1;
  do { k++; p *= r(); } while (p > L);
  return k - 1;
}

// Serie de demanda entera y no negativa ~ N(mu, sigma).
export const demandStream = (seed, n, mu, sigma) => {
  const r = mulberry32(seed);
  return Array.from({ length: n }, () => Math.max(0, Math.round(mu + sigma * gauss(r))));
};
