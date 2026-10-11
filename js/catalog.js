// Metadatos de los 8 simuladores — copiados del arreglo SIMS de SimuLab.dc.html.
// Cada entrada enlaza su función pura run(params, seed) de js/sims/.
import { run as oferta } from './sims/oferta.js';
import { run as interes } from './sims/interes.js';
import { run as eoq } from './sims/eoq.js';
import { run as rop } from './sims/rop.js';
import { run as revision } from './sims/revision.js';
import { run as bullwhip } from './sims/bullwhip.js';
import { run as beer } from './sims/beer.js';
import { run as colas } from './sims/colas.js';

export const SIMS = [
  {
    id: 'oferta', num: '01', group: 'Economía y finanzas', title: 'Oferta y demanda', stochastic: false, run: oferta,
    short: 'Encuentra el precio y la cantidad de equilibrio de un mercado y observa cómo los desplaza un impuesto o un cambio de sensibilidad.',
    formula: 'Qd = a − b·P   ·   Qs = c + d·(P − t)   ·   P* = (a − c + d·t) / (b + d)',
    que: 'Modela un mercado con una curva de demanda y una de oferta lineales. El punto donde se cruzan es el equilibrio: el precio al que lo que los compradores quieren comprar coincide con lo que los vendedores quieren vender. Un impuesto por unidad desplaza la oferta hacia arriba.',
    efectos: ['Subir la demanda máxima (a) desplaza la demanda a la derecha: suben precio y cantidad.', 'Una demanda poco sensible (b baja) hace que el consumidor absorba la mayor parte de un impuesto.', 'Un impuesto reduce la cantidad transada y genera recaudación, pero también reduce el excedente del consumidor.'],
    utilidad: ['Fijar precios y anticipar cómo reaccionarán las ventas ante un cambio de precio.', 'Evaluar el impacto de impuestos, aranceles o subsidios sobre márgenes y volumen.', 'Explicar escasez o excedentes cuando el precio se aleja del equilibrio.'],
    params: [
      { key: 'a', label: 'Demanda máxima (a)', min: 50, max: 200, step: 5, def: 120, unit: 'unid.', desc: 'Cantidad que se demandaría si el producto fuera gratis. Refleja el tamaño del mercado.' },
      { key: 'b', label: 'Sensibilidad de la demanda (b)', min: 0.5, max: 5, step: 0.1, def: 2, dec: 1, desc: 'Unidades que dejan de comprarse por cada $1 de aumento en el precio.' },
      { key: 'c', label: 'Oferta base (c)', min: 0, max: 60, step: 1, def: 10, unit: 'unid.', desc: 'Cantidad que los productores ofrecerían aun con un precio cercano a cero.' },
      { key: 'd', label: 'Sensibilidad de la oferta (d)', min: 0.5, max: 5, step: 0.1, def: 1.5, dec: 1, desc: 'Unidades adicionales que se producen por cada $1 de aumento en el precio.' },
      { key: 't', label: 'Impuesto por unidad (t)', min: 0, max: 20, step: 1, def: 0, pre: '$', desc: 'Impuesto que paga el vendedor por cada unidad vendida. Desplaza la oferta hacia arriba.' }
    ]
  },
  {
    id: 'interes', num: '02', group: 'Economía y finanzas', title: 'Interés compuesto y decisiones financieras', stochastic: false, run: interes,
    short: 'Proyecta el crecimiento de una inversión con aportes periódicos y compara el interés compuesto con el simple, antes y después de la inflación.',
    formula: 'VF = P·(1 + r/n)^(n·t) + Σ aportes capitalizados   ·   Valor real = VF / (1 + π)^t',
    que: 'Calcula mes a mes el saldo de una inversión que reinvierte sus intereses (interés compuesto) y lo compara con una que solo gana intereses sobre el capital (interés simple). Descuenta la inflación para mostrar el poder adquisitivo real del saldo final.',
    efectos: ['El tiempo es el factor más potente: duplicar los años más que duplica los intereses.', 'Capitalizar con más frecuencia aumenta el rendimiento, aunque el efecto es pequeño frente a la tasa y el plazo.', 'Con inflación alta, un saldo nominal grande puede representar poco poder de compra.'],
    utilidad: ['Comparar alternativas de ahorro, inversión o crédito con la misma base.', 'Planear metas (retiro, compra de equipo) definiendo aporte y plazo necesarios.', 'Entender el costo real de una deuda que capitaliza intereses.'],
    params: [
      { key: 'P0', label: 'Capital inicial', min: 0, max: 100000, step: 1000, def: 10000, pre: '$', desc: 'Monto que se invierte al inicio.' },
      { key: 'A', label: 'Aporte mensual', min: 0, max: 2000, step: 50, def: 200, pre: '$', desc: 'Depósito adicional al final de cada mes.' },
      { key: 'r', label: 'Tasa anual (r)', min: 0, max: 20, step: 0.25, def: 8, dec: 2, unit: '%', desc: 'Rendimiento nominal anual de la inversión.' },
      { key: 'Y', label: 'Plazo (t)', min: 1, max: 40, step: 1, def: 20, unit: 'años', desc: 'Tiempo que el dinero permanece invertido.' },
      { key: 'n', label: 'Capitalización (n)', type: 'seg', def: 12, opts: [['Anual', 1], ['Trimestral', 4], ['Mensual', 12], ['Diaria', 365]], desc: 'Veces por año que los intereses se suman al capital.' },
      { key: 'inf', label: 'Inflación anual (π)', min: 0, max: 10, step: 0.5, def: 3, dec: 1, unit: '%', desc: 'Pérdida anual de poder adquisitivo del dinero.' }
    ]
  },
  {
    id: 'eoq', num: '03', group: 'Inventarios', title: 'Cantidad económica de pedido (EOQ)', stochastic: false, run: eoq,
    short: 'Calcula el tamaño de pedido que minimiza la suma del costo de pedir y el costo de mantener inventario.',
    formula: 'Q* = √(2·D·S / H)   ·   CT(Q) = (D/Q)·S + (Q/2)·H',
    que: 'Pedir mucho de una vez reduce el número de pedidos pero llena el almacén; pedir poco ahorra almacén pero multiplica los pedidos. El modelo EOQ encuentra el punto donde ambos costos se equilibran y el costo total anual es mínimo, suponiendo demanda constante.',
    efectos: ['En Q* el costo anual de pedir es exactamente igual al de mantener.', 'La curva de costo total es plana cerca del óptimo: desviarse 20% cuesta poco, desviarse 100% cuesta mucho.', 'Si el costo de mantener sube (H), conviene pedir lotes más pequeños y frecuentes.'],
    utilidad: ['Definir lotes de compra o de producción con criterio económico.', 'Negociar con proveedores: estimar cuánto vale reducir el costo por pedido.', 'Detectar políticas de compra que inflan el costo total sin necesidad.'],
    params: [
      { key: 'D', label: 'Demanda anual (D)', min: 1000, max: 50000, step: 500, def: 12000, unit: 'unid./año', desc: 'Unidades que se consumen o venden en un año.' },
      { key: 'S', label: 'Costo por pedido (S)', min: 10, max: 500, step: 5, def: 100, pre: '$', desc: 'Costo fijo de emitir, transportar y recibir un pedido, sin importar su tamaño.' },
      { key: 'H', label: 'Costo de mantener (H)', min: 0.5, max: 20, step: 0.5, def: 2.5, dec: 1, pre: '$', unit: '/unid.·año', desc: 'Costo de tener una unidad almacenada un año: espacio, capital, seguros, merma.' },
      { key: 'Qa', label: 'Tu tamaño de pedido actual', min: 100, max: 5000, step: 50, def: 1500, unit: 'unid.', desc: 'Política vigente para comparar contra el óptimo.' }
    ]
  },
  {
    id: 'rop', num: '04', group: 'Inventarios', title: 'Punto de reorden con demanda variable', stochastic: true, run: rop,
    short: 'Simula 180 días de demanda aleatoria y muestra cuándo reordenar y cuánto stock de seguridad hace falta para no quedarse sin producto.',
    formula: 'ROP = d̄·L + z·σd·√L   ·   SS = z·σd·√L   ·   z = Φ⁻¹(nivel de servicio)',
    que: 'Cada día llega una demanda aleatoria (distribución normal). Cuando el inventario disponible más lo ya pedido cae al punto de reorden, se emite un pedido de Q unidades que llega tras el tiempo de entrega L. El stock de seguridad cubre la variabilidad de la demanda durante ese tiempo.',
    efectos: ['Más variabilidad (σ) o un tiempo de entrega mayor (L) exigen más stock de seguridad.', 'Pasar de 95% a 99% de nivel de servicio aumenta el stock de seguridad mucho más que de 90% a 95%.', 'El nivel de servicio real varía entre semillas: es una probabilidad, no una garantía.'],
    utilidad: ['Configurar alertas de reorden en un sistema de inventarios o ERP.', 'Cuantificar el costo de ofrecer mayor disponibilidad al cliente.', 'Justificar la reducción de tiempos de entrega con proveedores.'],
    params: [
      { key: 'mu', label: 'Demanda diaria promedio (d̄)', min: 5, max: 100, step: 1, def: 20, unit: 'unid./día', desc: 'Consumo medio por día.' },
      { key: 'sigma', label: 'Variabilidad diaria (σd)', min: 0, max: 30, step: 1, def: 6, unit: 'unid.', desc: 'Desviación estándar de la demanda diaria. Cero equivale a demanda constante.' },
      { key: 'L', label: 'Tiempo de entrega (L)', min: 1, max: 20, step: 1, def: 5, unit: 'días', desc: 'Días entre emitir un pedido y recibirlo.' },
      { key: 'sl', label: 'Nivel de servicio objetivo', min: 80, max: 99.5, step: 0.5, def: 95, dec: 1, unit: '%', desc: 'Probabilidad deseada de no tener faltante durante el tiempo de entrega.' },
      { key: 'Q', label: 'Tamaño de pedido (Q)', min: 50, max: 2000, step: 10, def: 300, unit: 'unid.', desc: 'Unidades que se piden cada vez que se alcanza el punto de reorden.' }
    ]
  },
  {
    id: 'revision', num: '05', group: 'Inventarios', title: 'Sistemas de revisión: continua vs. periódica', stochastic: true, run: revision,
    short: 'Compara, con la misma demanda, un sistema que reordena al llegar a un umbral contra uno que revisa el inventario cada T días.',
    formula: 'Continua (Q, R): R = d̄·L + z·σ√L   ·   Periódica (T, S): S = d̄·(T+L) + z·σ√(T+L)',
    que: 'En revisión continua se vigila el inventario todo el tiempo y se pide una cantidad fija Q al tocar el punto de reorden. En revisión periódica se revisa cada T días y se pide lo necesario para volver al nivel objetivo S. Ambos sistemas enfrentan exactamente la misma demanda aleatoria.',
    efectos: ['La revisión periódica debe proteger T + L días de incertidumbre, por eso mantiene más inventario.', 'Alargar el período de revisión T eleva el nivel objetivo y el inventario promedio.', 'La revisión continua emite pedidos de tamaño fijo en fechas variables; la periódica, de tamaño variable en fechas fijas.'],
    utilidad: ['Elegir política según el costo de monitorear: artículos críticos o caros suelen ir en revisión continua.', 'Consolidar pedidos de varios artículos a un mismo proveedor con revisión periódica.', 'Estimar cuánto inventario extra cuesta revisar con menos frecuencia.'],
    params: [
      { key: 'mu', label: 'Demanda diaria promedio', min: 5, max: 100, step: 1, def: 20, unit: 'unid./día', desc: 'Consumo medio por día.' },
      { key: 'sigma', label: 'Variabilidad diaria (σ)', min: 0, max: 30, step: 1, def: 6, unit: 'unid.', desc: 'Desviación estándar de la demanda diaria.' },
      { key: 'L', label: 'Tiempo de entrega (L)', min: 1, max: 15, step: 1, def: 4, unit: 'días', desc: 'Días entre pedir y recibir, igual para ambos sistemas.' },
      { key: 'T', label: 'Período de revisión (T)', min: 1, max: 30, step: 1, def: 10, unit: 'días', desc: 'Cada cuántos días se revisa el inventario en el sistema periódico.' },
      { key: 'Q', label: 'Pedido fijo continuo (Q)', min: 50, max: 1000, step: 10, def: 200, unit: 'unid.', desc: 'Cantidad que pide el sistema continuo en cada reorden.' },
      { key: 'sl', label: 'Nivel de servicio objetivo', min: 80, max: 99.5, step: 0.5, def: 95, dec: 1, unit: '%', desc: 'Se usa para dimensionar el stock de seguridad de ambos sistemas.' }
    ]
  },
  {
    id: 'bullwhip', num: '06', group: 'Cadena de suministro', title: 'Efecto látigo (bullwhip effect)', stochastic: true, run: bullwhip,
    short: 'Observa cómo pequeñas variaciones en la demanda del cliente se amplifican en los pedidos a medida que suben por la cadena de suministro.',
    formula: 'Fₜ = α·Dₜ + (1−α)·Fₜ₋₁   ·   Sₜ = Fₜ·(L+1)   ·   Oₜ = máx(0, Dₜ + Sₜ − Sₜ₋₁)',
    que: 'Cuatro eslabones (minorista, mayorista, distribuidor y fábrica) pronostican su demanda con suavizamiento exponencial y piden para reponer lo vendido más el ajuste de su nivel objetivo. Cada eslabón solo ve los pedidos del eslabón siguiente, no la demanda final del cliente.',
    efectos: ['La variabilidad de los pedidos crece en cada eslabón: la fábrica ve la demanda más volátil.', 'Un α alto (reaccionar mucho al último dato) y tiempos de entrega largos amplifican el efecto.', 'Con demanda constante (σ = 0) el efecto desaparece: lo provoca la reacción a la variabilidad.'],
    utilidad: ['Justificar compartir datos de punto de venta con proveedores (visibilidad de la demanda).', 'Explicar sobreinventarios y faltantes alternados en fábricas y centros de distribución.', 'Diseñar acuerdos de reposición (VMI, CPFR) y reducir tiempos de entrega.'],
    params: [
      { key: 'mu', label: 'Demanda semanal del cliente', min: 10, max: 100, step: 1, def: 20, unit: 'unid.', desc: 'Promedio de compras del consumidor final por semana.' },
      { key: 'sigma', label: 'Variabilidad de la demanda (σ)', min: 0, max: 20, step: 1, def: 4, unit: 'unid.', desc: 'Desviación estándar de la demanda semanal del cliente.' },
      { key: 'L', label: 'Tiempo de entrega por eslabón', min: 1, max: 6, step: 1, def: 2, unit: 'semanas', desc: 'Semanas que tarda en llegar un pedido en cada eslabón.' },
      { key: 'alpha', label: 'Reactividad del pronóstico (α)', min: 0.05, max: 1, step: 0.05, def: 0.3, dec: 2, desc: 'Peso del dato más reciente en el pronóstico. Cerca de 1 = reacciona a cada cambio.' }
    ]
  },
  {
    id: 'beer', num: '07', group: 'Cadena de suministro', title: 'Beer Game (versión simplificada)', stochastic: false, run: beer,
    short: 'Recrea el juego de la cerveza del MIT: un aumento único en la demanda del cliente provoca oscilaciones de inventario y faltantes en toda la cadena.',
    formula: 'Oₜ = máx(0, Êₜ + β·[(S* − Inv. neto) + θ·(Ê·L − Línea de suministro)])',
    que: 'Cuatro roles con 12 unidades iniciales atienden una demanda de 4 cajas por semana, que sube una sola vez en la semana 5. Cada rol decide su pedido con una regla de ajuste: β mide qué tan agresivo corrige su inventario y θ cuánto tiene en cuenta lo que ya viene en camino. Mantener inventario cuesta $0,50 por caja y semana; cada caja pendiente (backlog) cuesta $1.',
    efectos: ['Ignorar la línea de suministro (θ cercano a 0) es la causa principal de sobrepedidos y oscilaciones.', 'Un β alto corrige rápido pero exagera: el inventario cae en faltante y luego se dispara.', 'Los eslabones más alejados del cliente sufren las mayores oscilaciones y costos.'],
    utilidad: ['Entrenar equipos en pensamiento sistémico y los riesgos de decidir con información local.', 'Mostrar el valor de considerar los pedidos en tránsito antes de volver a pedir.', 'Discutir coordinación e incentivos entre áreas o empresas de una misma cadena.'],
    params: [
      { key: 'd2', label: 'Demanda tras el escalón', min: 4, max: 16, step: 1, def: 8, unit: 'cajas/sem.', desc: 'Nueva demanda semanal del cliente a partir de la semana 5 (antes: 4).' },
      { key: 'D', label: 'Retraso de envío', min: 1, max: 4, step: 1, def: 2, unit: 'semanas', desc: 'Semanas que tarda un envío entre roles (y la producción en la fábrica).' },
      { key: 'beta', label: 'Agresividad del ajuste (β)', min: 0.05, max: 1, step: 0.05, def: 0.4, dec: 2, desc: 'Fracción de la brecha de inventario que cada rol intenta cerrar cada semana.' },
      { key: 'theta', label: 'Peso de la línea de suministro (θ)', min: 0, max: 1, step: 0.05, def: 0.2, dec: 2, desc: 'Cuánto considera cada rol lo que ya pidió y aún no llega. 1 = lo considera por completo.' },
      { key: 'target', label: 'Inventario objetivo (S*)', min: 0, max: 30, step: 1, def: 12, unit: 'cajas', desc: 'Inventario que cada rol quiere mantener.' }
    ]
  },
  {
    id: 'colas', num: '08', group: 'Servicios', title: 'Teoría de colas y cuellos de botella', stochastic: true, run: colas,
    short: 'Simula una jornada de 8 horas en un servicio con varios servidores y localiza la etapa que limita el flujo de todo el proceso.',
    formula: 'ρ = λ / (c·μ)   ·   M/M/c (Erlang C): Lq, Wq = Lq/λ, W = Wq + 1/μ   ·   Throughput = mín(λ, capacidades)',
    que: 'Los clientes llegan al azar (proceso de Poisson, λ por hora) y son atendidos por c servidores con tiempos de servicio exponenciales (μ por hora cada uno). Se calcula la espera teórica con el modelo M/M/c y se simula minuto a minuto la longitud de la cola. El proceso tiene tres etapas; la de menor capacidad es el cuello de botella.',
    efectos: ['Cuando la utilización ρ se acerca a 100% la espera crece de forma explosiva, no lineal.', 'Con ρ ≥ 100% la cola crece sin límite durante toda la jornada.', 'Ampliar una etapa que no es el cuello de botella no aumenta la capacidad del proceso.'],
    utilidad: ['Dimensionar cajas, ventanillas, agentes de call center o camas de hospital.', 'Fijar metas de nivel de servicio (tiempo de espera) y su costo en personal.', 'Priorizar inversiones en la etapa que realmente limita la producción.'],
    params: [
      { key: 'lam', label: 'Tasa de llegada (λ)', min: 1, max: 60, step: 1, def: 18, unit: 'clientes/h', desc: 'Clientes que llegan en promedio por hora.' },
      { key: 'mu', label: 'Tasa de servicio por servidor (μ)', min: 1, max: 30, step: 1, def: 7, unit: 'clientes/h', desc: 'Clientes que atiende un servidor por hora (60/μ = minutos por cliente).' },
      { key: 'c', label: 'Número de servidores (c)', min: 1, max: 8, step: 1, def: 3, desc: 'Ventanillas, cajeros o agentes trabajando en paralelo en la etapa de atención.' },
      { key: 'cap1', label: 'Capacidad de recepción', min: 5, max: 80, step: 1, def: 30, unit: 'clientes/h', desc: 'Máximo de clientes por hora que procesa la etapa previa (registro, triaje).' },
      { key: 'cap3', label: 'Capacidad de cobro', min: 5, max: 80, step: 1, def: 24, unit: 'clientes/h', desc: 'Máximo de clientes por hora que procesa la etapa final (caja, salida).' }
    ]
  }
];

export const DEFAULT_SEED = 42;

export const defaults = () =>
  Object.fromEntries(SIMS.map(s => [s.id, Object.fromEntries(s.params.map(p => [p.key, p.def]))]));

export const groups = () =>
  [...new Set(SIMS.map(s => s.group))].map(name => ({ name, items: SIMS.filter(s => s.group === name) }));

// Valor formateado de un parámetro, como en el mockup.
export function displayParam(p, val) {
  if (p.type === 'seg') return p.opts.find(o => o[1] === val)?.[0] ?? String(val);
  const n = Number(val).toLocaleString('es-MX', { minimumFractionDigits: p.dec || 0, maximumFractionDigits: p.dec || 0 });
  const sep = p.unit && !(p.unit.startsWith('/') || p.unit === '%') ? ' ' : '';
  return (p.pre || '') + n + (p.unit ? sep + p.unit : '');
}
