import { Lead } from './types';

export function isOverdue(lead: Lead): boolean {
  if (lead.estado === 'Cerrado ganado' || lead.estado === 'Cerrado perdido' || lead.estado === 'Descartado') {
    return false;
  }
  const ref = lead.ultimo_contacto ?? lead.fecha_ingreso;
  const days = (Date.now() - new Date(ref).getTime()) / 86_400_000;
  return days > 7;
}
