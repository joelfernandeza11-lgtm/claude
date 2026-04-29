export type Escala = 'Chica <30k USD' | 'Media 30k-200k' | 'Grande +200k';
export type Canal = 'WhatsApp' | 'Instagram DM' | 'Web' | 'Referido';
export type Estado =
  | 'Nuevo'
  | 'Contactado'
  | 'Calificado'
  | 'Propuesta enviada'
  | 'Cerrado ganado'
  | 'Cerrado perdido'
  | 'Descartado';

export interface Lead {
  id: string;
  nombre: string;
  empresa: string;
  tipo_proyecto: string;
  zona: string;
  escala: Escala;
  canal: Canal;
  estado: Estado;
  fecha_ingreso: string;
  ultimo_contacto: string | null;
  notas: string;
  created_at: string;
  updated_at: string;
}

export type LeadInput = Omit<Lead, 'id' | 'created_at' | 'updated_at'>;

export const ESCALAS: Escala[] = ['Chica <30k USD', 'Media 30k-200k', 'Grande +200k'];
export const CANALES: Canal[] = ['WhatsApp', 'Instagram DM', 'Web', 'Referido'];
export const ESTADOS: Estado[] = [
  'Nuevo',
  'Contactado',
  'Calificado',
  'Propuesta enviada',
  'Cerrado ganado',
  'Cerrado perdido',
  'Descartado',
];

export const STATUS_COLORS: Record<Estado, { bg: string; text: string; dot: string }> = {
  'Nuevo':             { bg: 'bg-slate-700/60',  text: 'text-slate-300',  dot: 'bg-slate-400' },
  'Contactado':        { bg: 'bg-slate-700/60',  text: 'text-slate-300',  dot: 'bg-slate-400' },
  'Calificado':        { bg: 'bg-blue-900/60',   text: 'text-blue-300',   dot: 'bg-blue-400' },
  'Propuesta enviada': { bg: 'bg-amber-900/60',  text: 'text-amber-300',  dot: 'bg-amber-400' },
  'Cerrado ganado':    { bg: 'bg-green-900/60',  text: 'text-green-300',  dot: 'bg-green-400' },
  'Cerrado perdido':   { bg: 'bg-red-900/60',    text: 'text-red-300',    dot: 'bg-red-400' },
  'Descartado':        { bg: 'bg-slate-800/60',  text: 'text-slate-500',  dot: 'bg-slate-600' },
};
