'use client';

import { RegistroDiario, Costo, Pedido } from '@/lib/types';

interface Props {
  registros: RegistroDiario[];
  costos: Costo[];
  pedidos: Pedido[];
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);
}

export default function ResumenCards({ registros, costos, pedidos }: Props) {
  const totalFacturacion = registros.reduce((s, r) => s + Number(r.facturacion), 0);
  const totalGanancia    = registros.reduce((s, r) => s + Number(r.ganancia), 0);
  const totalCostos      = costos.reduce((s, c) => s + Number(c.monto), 0);
  const totalPedidos     = pedidos
    .filter(p => p.estado !== 'cancelado')
    .reduce((s, p) => s + Number(p.monto), 0);
  const totalEgresos = totalCostos + totalPedidos;
  const neto = totalGanancia - totalEgresos;

  const cards = [
    { label: 'Facturación total', value: fmt(totalFacturacion), color: '#3b82f6', sub: `${registros.length} días registrados` },
    { label: 'Ganancia total', value: fmt(totalGanancia), color: '#10b981', sub: `${totalFacturacion > 0 ? ((totalGanancia / totalFacturacion) * 100).toFixed(1) : 0}% del facturado` },
    { label: 'Costos + Pedidos', value: fmt(totalEgresos), color: '#f59e0b', sub: `${fmt(totalCostos)} costos · ${fmt(totalPedidos)} pedidos` },
    { label: 'Resultado neto', value: fmt(neto), color: neto >= 0 ? '#10b981' : '#ef4444', sub: neto >= 0 ? 'Positivo' : 'Negativo' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map(c => (
        <div
          key={c.label}
          className="rounded-xl p-4 flex flex-col gap-1"
          style={{ background: '#111827', border: '1px solid #1e2d4a' }}
        >
          <span className="text-xs font-medium" style={{ color: '#64748b' }}>{c.label}</span>
          <span className="text-xl font-bold" style={{ color: c.color }}>{c.value}</span>
          <span className="text-xs" style={{ color: '#475569' }}>{c.sub}</span>
        </div>
      ))}
    </div>
  );
}
