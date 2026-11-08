import type { Brand, ScoreBreakdown } from './types';

/**
 * Puntaje transparente 0-100. No es "verdad absoluta": ordena la evidencia que
 * el agente encontró. Los pesos se muestran en la UI para que se pueda auditar.
 */
export function scoreBrand(b: Brand): ScoreBreakdown {
  const landing = b.landing ? 20 : 0;
  const meta = { confirmed: 25, likely: 15, unknown: 3, none: 0 }[b.meta.status];
  const amazon = { confirmed: 15, likely: 9, unknown: 2, none: 0 }[b.amazon.status];
  const traction = Math.round(Math.max(0, Math.min(10, b.traction)) * 2.5); // 0-25
  const breadth = Math.min(10, b.formats.length * 3) + Math.min(5, Math.max(0, b.markets.length - 1) * 2.5); // 0-15
  const parts = [
    { label: 'Tienda / landing propia', value: landing, max: 20 },
    { label: 'Señal de Meta Ads', value: meta, max: 25 },
    { label: 'Amazon', value: amazon, max: 15 },
    { label: 'Tracción (reviews, prensa, social)', value: traction, max: 25 },
    { label: 'Amplitud (formatos y mercados)', value: Math.round(breadth), max: 15 },
  ];
  return { total: parts.reduce((a, p) => a + p.value, 0), parts };
}
