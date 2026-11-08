import type { Brand, DiscoverResult } from './types';

/**
 * MODO DEMO — datos ilustrativos para probar la interfaz sin API key.
 * NO son resultados verificados: no hay precios, ni confirmación de anuncios.
 */
const base = (b: Partial<Brand> & Pick<Brand, 'id' | 'name' | 'website' | 'markets'>): Brand => ({
  formats: [],
  positioning: '',
  angle: '',
  why: 'Ejemplo ilustrativo (modo demo).',
  priceRange: '',
  landing: true,
  meta: { status: 'unknown', note: 'Demo: sin verificar. Revisá la Biblioteca de Anuncios.' },
  amazon: { status: 'unknown' },
  traction: 5,
  tractionSignals: [],
  reviewThemes: [],
  sources: [],
  demo: true,
  ...b,
});

export const DEMO_BRANDS: Record<string, Brand[]> = {
  US: [
    base({
      id: 'nutrafol.com', name: 'Nutrafol', website: 'https://nutrafol.com', markets: ['US'], traction: 9,
      positioning: 'Suplemento de salud capilar para hombres y mujeres, con enfoque “clínico”.',
      angle: 'Respaldo científico + médicos + estudios clínicos.',
      formats: [{ format: 'capsulas', product: 'Suplemento diario', price: '' }],
      meta: { status: 'likely', note: 'Demo: marca muy activa en paid social (ilustrativo).' },
      amazon: { status: 'likely' }, tractionSignals: ['Alta presencia en prensa (ilustrativo)'],
    }),
    base({
      id: 'forhims.com', name: 'Hims & Hers', website: 'https://www.forhims.com', markets: ['US'], traction: 9,
      positioning: 'Telehealth + productos de cuidado capilar en formato suscripción.',
      angle: 'Conveniencia, privacidad y suscripción.',
      formats: [{ format: 'kit', product: 'Kit capilar', price: '' }, { format: 'shampoo', product: 'Shampoo', price: '' }, { format: 'gomitas', product: 'Gomitas capilares', price: '' }],
      meta: { status: 'likely', note: 'Demo: gran inversión publicitaria (ilustrativo).' },
    }),
    base({
      id: 'vegamour.com', name: 'Vegamour', website: 'https://vegamour.com', markets: ['US'], traction: 7,
      positioning: 'Cuidado capilar “clean” con ingredientes botánicos.',
      angle: 'Fórmulas veganas / clean beauty.',
      formats: [{ format: 'serum', product: 'Sérum', price: '' }, { format: 'gomitas', product: 'Gomitas', price: '' }, { format: 'shampoo', product: 'Shampoo', price: '' }],
      amazon: { status: 'unknown' },
    }),
    base({
      id: 'keeps.com', name: 'Keeps', website: 'https://www.keeps.com', markets: ['US'], traction: 6,
      positioning: 'Suscripción de tratamiento capilar para hombres.',
      angle: 'Simple, discreto y a domicilio.',
      formats: [{ format: 'liquido', product: 'Tópico', price: '' }, { format: 'kit', product: 'Kit', price: '' }],
    }),
  ],
  GB: [
    base({
      id: 'viviscal.com', name: 'Viviscal', website: 'https://www.viviscal.com', markets: ['GB'], traction: 7,
      positioning: 'Suplementos para el crecimiento del cabello, con línea de shampoo.',
      angle: 'Complejo marino patentado y trayectoria.',
      formats: [{ format: 'capsulas', product: 'Suplemento', price: '' }, { format: 'shampoo', product: 'Shampoo', price: '' }],
      amazon: { status: 'likely' },
    }),
    base({
      id: 'hairburst.com', name: 'Hairburst', website: 'https://www.hairburst.com', markets: ['GB'], traction: 6,
      positioning: 'Vitaminas capilares con comunidad y UGC.',
      angle: 'Comunidad y resultados de clientas.',
      formats: [{ format: 'gomitas', product: 'Gomitas', price: '' }, { format: 'capsulas', product: 'Vitaminas', price: '' }, { format: 'shampoo', product: 'Shampoo', price: '' }],
      amazon: { status: 'likely' },
    }),
  ],
  CA: [
    base({
      id: 'nutrafol.com', name: 'Nutrafol', website: 'https://nutrafol.com', markets: ['CA'], traction: 8,
      formats: [{ format: 'capsulas', product: 'Suplemento diario', price: '' }],
      positioning: 'Suplemento de salud capilar.', angle: 'Respaldo científico.',
    }),
  ],
  AU: [
    base({
      id: 'hairburst.com', name: 'Hairburst', website: 'https://www.hairburst.com', markets: ['AU'], traction: 5,
      formats: [{ format: 'gomitas', product: 'Gomitas', price: '' }],
      positioning: 'Vitaminas capilares.', angle: 'Comunidad.',
    }),
  ],
};

export const DEMO_QUERIES = [
  'best hair loss brands online',
  'hair growth supplement reviews',
  'hair serum brands amazon bestsellers',
  'DTC hair loss subscription brands',
];

/** Marcas extra que "aparecen" en la ronda 2 de la demo (foco en gomitas). */
export const DEMO_FOCUS_BRANDS: Record<string, Brand[]> = {
  US: [
    base({
      id: 'sugarbearhair.com', name: 'SugarBearHair', website: 'https://www.sugarbearhair.com', markets: ['US'], traction: 8,
      positioning: 'Gomitas de biotina con enfoque en sabor y comunidad.',
      angle: 'Influencers + sabor + rutina diaria.',
      formats: [{ format: 'gomitas', product: 'Gomitas capilares', price: '' }],
      reviewThemes: ['elogio: sabor agradable', 'queja: resultados lentos', 'queja: azúcar'],
      meta: { status: 'likely', note: 'Demo: fuerte presencia en social (ilustrativo).' },
      amazon: { status: 'likely' },
    }),
  ],
  GB: [
    base({
      id: 'hairburst.com', name: 'Hairburst', website: 'https://www.hairburst.com', markets: ['GB'], traction: 6,
      formats: [{ format: 'gomitas', product: 'Gomitas', price: '' }],
      positioning: 'Vitaminas capilares.', angle: 'Comunidad.',
      reviewThemes: ['queja: tarda en notarse', 'elogio: textura del pelo'],
    }),
  ],
};

const D = (d: DiscoverResult) => d;

/** Respuestas de Atlas para la demo, por etapa (ilustrativas, sin datos reales). */
export const DEMO_DISCOVER: Record<string, DiscoverResult> = {
  explorar: D({
    stage: 'explorar',
    headline: 'Hay mucha oferta en cápsulas y kits; las gomitas crecen, pero casi nadie habla al hombre de 30–45 con un enfoque simple y discreto.',
    findings: [
      { title: 'Cápsulas: formato más saturado', detail: 'Aparecen en casi todos los mercados y con respaldo "clínico". Entrar con lo mismo es competir contra marcas con mucha inversión.', confidence: 'alta', basis: 'evidencia' },
      { title: 'Gomitas: formato en expansión', detail: 'Varias marcas lo suman como línea secundaria. Ofrece mejor adherencia y recompra, pero la promesa se repite.', confidence: 'media', basis: 'evidencia' },
      { title: 'Marcas presentes en varios mercados', detail: 'Las que se repiten en 2+ países suelen tener logística y publicidad ya probadas: son tus referencias más sólidas.', confidence: 'alta', basis: 'evidencia' },
      { title: 'Ángulo dominante: "ciencia + médicos"', detail: 'Casi todos se apoyan en lo clínico. Un ángulo más simple y cotidiano está poco explotado.', confidence: 'media', basis: 'inferencia' },
      { title: 'Riesgo de claims', detail: 'Prometer "detener la caída" puede chocar con las regulaciones de suplementos en EE.UU., Reino Unido y Australia.', confidence: 'alta', basis: 'inferencia' },
    ],
    question: '¿Qué dirección exploramos a fondo?',
    options: [
      { id: 'a', label: 'Gomitas para hombres 30–45', detail: 'Rutina simple, sabor y suscripción. Menos "clínico", más cotidiano.', format: 'gomitas', audience: 'Hombres 30–45', angle: 'Simple y discreto', price: 'Medio', risk: 'Promesa parecida a la de otros', recommended: true },
      { id: 'b', label: 'Sérum tópico + gotero', detail: 'Formato visual, ticket alto y buen contenido para anuncios.', format: 'serum', audience: 'Mujeres 35–55', angle: 'Ritual de cuidado', price: 'Premium', risk: 'Mayor desafío de claims' },
      { id: 'c', label: 'Kit sistema (shampoo + suplemento)', detail: 'Sube el ticket promedio y la recompra con un "sistema".', format: 'kit', audience: 'Unisex 30–50', angle: 'Sistema completo', price: 'Premium', risk: 'Inventario y complejidad' },
    ],
    board: { format: 'Gomitas', audience: 'Hombres 30–45', angle: 'Simple y discreto' },
    readiness: 25,
  }),
  enfocar: D({
    stage: 'enfocar',
    headline: 'En gomitas capilares los clientes elogian el sabor pero dudan de los resultados: el hueco está en la confianza, no en el producto.',
    findings: [
      { title: 'Competencia directa acotada', detail: 'Pocas marcas hacen de las gomitas su producto principal; la mayoría las usa como línea secundaria.', confidence: 'media', basis: 'evidencia' },
      { title: 'Voz del cliente: sabor sí, resultados dudosos', detail: 'Se repite el elogio al sabor y la queja de "resultados lentos" y de azúcar.', confidence: 'media', basis: 'evidencia' },
      { title: 'Oferta típica: suscripción con descuento', detail: 'La mecánica dominante es suscripción mensual con precio menor por compromiso.', confidence: 'media', basis: 'evidencia' },
      { title: 'Hueco real: expectativas honestas', detail: 'Una marca que fije expectativas realistas (ej. 90 días) y mida progreso podría diferenciarse.', confidence: 'baja', basis: 'inferencia' },
    ],
    question: '¿Con qué diferencial y público vamos?',
    options: [
      { id: 'a', label: 'Sin azúcar + seguimiento a 90 días', detail: 'Responde a las dos quejas más repetidas y construye confianza.', format: 'gomitas', audience: 'Hombres 30–45', angle: 'Expectativas honestas', price: 'Medio', risk: 'Formulación sin azúcar más costosa', recommended: true },
      { id: 'b', label: 'Prevención temprana (25–35)', detail: 'Público joven que quiere "cuidarse antes", con ticket más bajo.', format: 'gomitas', audience: 'Hombres y mujeres 25–35', angle: 'Prevención', price: 'Accesible', risk: 'Menor urgencia de compra' },
      { id: 'c', label: 'Dúo gomitas + tópico', detail: 'Combina dos formatos para subir ticket y resultados percibidos.', format: 'kit', audience: 'Hombres 35–50', angle: 'Doble acción', price: 'Premium', risk: 'Complejidad operativa' },
    ],
    board: { format: 'Gomitas sin azúcar', audience: 'Hombres 30–45', angle: 'Expectativas honestas' },
    readiness: 50,
  }),
  definir: D({
    stage: 'definir',
    headline: 'El precio de entrada importa menos que la suscripción: ahí se gana o se pierde la recompra.',
    findings: [
      { title: 'La recompra define el negocio', detail: 'Con productos de consumo diario, el valor está en cuántos meses se queda el cliente.', confidence: 'media', basis: 'inferencia' },
      { title: 'Guerra de precios: riesgo medio', detail: 'Hay marcas con descuentos agresivos por suscripción; competir solo por precio no es sostenible.', confidence: 'media', basis: 'evidencia' },
      { title: 'Supuesto de costos', detail: 'Asumimos margen bruto sano (≥ 70 %) típico de suplementos DTC; hay que validarlo con cotizaciones reales.', confidence: 'baja', basis: 'inferencia' },
    ],
    question: '¿Qué paquete de precio y oferta probamos?',
    options: [
      { id: 'a', label: 'Entrada baja + suscripción', detail: 'Primer mes accesible y descuento por suscripción a 3 meses.', price: 'Medio', recommended: true },
      { id: 'b', label: 'Pack de 3 meses con garantía', detail: 'Ticket alto inicial alineado con el ciclo real de resultados.', price: 'Medio-alto' },
      { id: 'c', label: 'Muestra de bajo costo', detail: 'Reduce la fricción de prueba y alimenta la suscripción.', price: 'Accesible' },
    ],
    board: { format: 'Gomitas sin azúcar', audience: 'Hombres 30–45', angle: 'Expectativas honestas', price: 'Entrada baja + suscripción' },
    readiness: 70,
  }),
  concepto: D({
    stage: 'concepto',
    headline: 'Concepto listo para validar: gomitas capilares sin azúcar para hombres 30–45, con seguimiento a 90 días y suscripción.',
    findings: [],
    options: [],
    board: { format: 'Gomitas sin azúcar', audience: 'Hombres 30–45', angle: 'Expectativas honestas', price: 'Entrada baja + suscripción' },
    readiness: 80,
    concept: {
      workingTitle: 'Gomitas capilares 90 días (título de trabajo)',
      oneLiner: 'Gomitas capilares sin azúcar para hombres de 30–45, con seguimiento a 90 días y expectativas honestas.',
      format: 'Gomitas',
      audience: 'Hombres de 30–45 que notan que pierden densidad y quieren una rutina simple.',
      painStatement: '“Veo que se me ralea el pelo y no sé si algo realmente funciona.”',
      promise: 'Una rutina diaria simple y un seguimiento claro para saber si te está sirviendo.',
      keyComponents: ['Biotina y micronutrientes (a definir con un formulador)', 'Sin azúcar agregada', 'Sabor agradable'],
      positioning: 'Para hombres que quieren cuidar su pelo sin complicarse, la rutina diaria más simple y honesta, con seguimiento a 90 días.',
      heroAngles: ['“Sin promesas mágicas: 90 días y lo medimos”', 'Rutina de 10 segundos', 'Sin azúcar, sin vueltas'],
      pricing: { positioning: 'Medio', range: 'Rango a validar con cotización de costos', offer: 'Primer mes accesible + descuento por suscripción a 3 meses + garantía' },
      competitorSet: [
        { name: 'Nutrafol', why: 'Referente de percepción "clínica" y de ticket alto.' },
        { name: 'Hairburst', why: 'Comunidad y gomitas; referencia de lenguaje cercano.' },
      ],
      differentiators: ['Sin azúcar', 'Seguimiento a 90 días', 'Expectativas honestas'],
      risks: ['Claims regulados por mercado: evitá prometer "frenar la caída"', 'Formulación sin azúcar más costosa', 'Dependencia de anuncios para adquirir clientes'],
      validationPlan: [
        { step: 'Landing + lista de espera', how: 'Una página con la promesa y 2 ángulos distintos', metric: 'Tasa de registro ≥ 10 % del tráfico' },
        { step: 'Test de anuncios (3 ángulos)', how: 'Presupuesto chico en Meta para comparar ángulos', metric: 'CTR y costo por registro' },
        { step: 'Preventa', how: 'Vender 50 unidades antes de producir', metric: '≥ 50 preventas' },
        { step: 'Cotizar formulación', how: 'Pedir presupuesto a 3 fabricantes', metric: 'Margen bruto ≥ 70 %' },
      ],
      openQuestions: ['¿Cuánto cuesta realmente la fórmula sin azúcar?', '¿Qué claims permite cada mercado objetivo?'],
    },
  }),
};
