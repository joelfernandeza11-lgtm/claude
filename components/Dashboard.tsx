'use client';

import { Lead } from '@/lib/types';

interface DashboardProps {
  leads: Lead[];
}

export default function Dashboard({ leads }: DashboardProps) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const total = leads.length;
  const calificados = leads.filter((l) => l.estado === 'Calificado').length;
  const propuestas = leads.filter((l) => l.estado === 'Propuesta enviada').length;
  const cerradosGanados = leads.filter(
    (l) =>
      l.estado === 'Cerrado ganado' &&
      new Date(l.fecha_ingreso) >= monthStart
  ).length;

  const stats = [
    { label: 'Total leads', value: total, color: '#1A6FD4' },
    { label: 'Calificados', value: calificados, color: '#60a5fa' },
    { label: 'Propuestas enviadas', value: propuestas, color: '#f59e0b' },
    { label: 'Cerrados ganados (mes)', value: cerradosGanados, color: '#22c55e' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl p-4"
          style={{ background: '#111827', border: '1px solid #1e2d4a' }}
        >
          <p className="text-xs font-medium mb-2" style={{ color: '#64748b' }}>
            {s.label}
          </p>
          <p className="text-3xl font-bold" style={{ color: s.color }}>
            {s.value}
          </p>
        </div>
      ))}
    </div>
  );
}
