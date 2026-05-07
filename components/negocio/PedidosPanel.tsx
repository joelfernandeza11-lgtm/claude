'use client';

import { useState } from 'react';
import { Pedido, PedidoInput, TipoPedido, EstadoPedido } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  pedidos: Pedido[];
  onAdd: (data: PedidoInput) => Promise<void>;
  onUpdateEstado: (id: string, estado: EstadoPedido) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);
}

const ESTADO_STYLES: Record<EstadoPedido, { bg: string; text: string; label: string }> = {
  pendiente: { bg: '#78350f20', text: '#f59e0b', label: 'Pendiente' },
  recibido:  { bg: '#05251420', text: '#10b981', label: 'Recibido' },
  cancelado: { bg: '#450a0a20', text: '#ef4444', label: 'Cancelado' },
};

export default function PedidosPanel({ pedidos, onAdd, onUpdateEstado, onDelete }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [proveedor, setProveedor] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [tipo, setTipo] = useState<TipoPedido>('inversion');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descripcion.trim()) return;
    setSaving(true);
    try {
      await onAdd({
        fecha,
        proveedor: proveedor.trim(),
        descripcion: descripcion.trim(),
        monto: parseFloat(monto) || 0,
        tipo,
        estado: 'pendiente',
      });
      setModalOpen(false);
      setProveedor('');
      setDescripcion('');
      setMonto('');
    } finally {
      setSaving(false);
    }
  };

  const totalPendiente = pedidos
    .filter(p => p.estado === 'pendiente')
    .reduce((s, p) => s + Number(p.monto), 0);

  const sorted = [...pedidos].sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <div className="flex flex-col gap-4">
      {/* Header + button */}
      <div
        className="rounded-xl p-4 flex items-center justify-between"
        style={{ background: '#111827', border: '1px solid #1e2d4a' }}
      >
        <div>
          <h2 className="font-semibold text-sm" style={{ color: '#e2e8f0' }}>Pedidos a proveedor</h2>
          {pedidos.filter(p => p.estado === 'pendiente').length > 0 && (
            <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
              {pedidos.filter(p => p.estado === 'pendiente').length} pendiente(s) · {fmt(totalPendiente)}
            </p>
          )}
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors"
          style={{ background: '#1A6FD4', color: '#fff' }}
        >
          <span>📦</span>
          Hacer pedido
        </button>
      </div>

      {/* Orders list */}
      {sorted.length > 0 ? (
        <div
          className="rounded-xl p-4 flex flex-col gap-2"
          style={{ background: '#111827', border: '1px solid #1e2d4a' }}
        >
          <div className="flex flex-col gap-2">
            {sorted.map(p => (
              <div
                key={p.id}
                className="rounded-lg p-3 flex flex-col gap-2 group"
                style={{ background: '#1a2236', border: '1px solid #1e2d4a' }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold" style={{ color: '#e2e8f0' }}>
                        {p.proveedor || 'Sin proveedor'}
                      </span>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full"
                        style={{ background: p.tipo === 'inversion' ? '#1e3a5f' : '#2d1b0e', color: p.tipo === 'inversion' ? '#60a5fa' : '#fb923c' }}
                      >
                        {p.tipo === 'inversion' ? 'Inversión' : 'Gasto'}
                      </span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>{p.descripcion}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#475569' }}>
                      {format(new Date(p.fecha + 'T12:00:00'), "d 'de' MMM yyyy", { locale: es })}
                    </p>
                  </div>
                  <div className="flex items-start gap-2 shrink-0 ml-2">
                    {p.monto > 0 && (
                      <span className="text-sm font-bold" style={{ color: '#f59e0b' }}>{fmt(p.monto)}</span>
                    )}
                    <button
                      onClick={() => onDelete(p.id)}
                      className="opacity-0 group-hover:opacity-100 text-xs transition-opacity"
                      style={{ color: '#ef4444' }}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Estado selector */}
                <div className="flex gap-1.5">
                  {(['pendiente', 'recibido', 'cancelado'] as EstadoPedido[]).map(est => (
                    <button
                      key={est}
                      onClick={() => onUpdateEstado(p.id, est)}
                      className="text-xs px-2 py-0.5 rounded-full transition-all"
                      style={{
                        background: p.estado === est ? ESTADO_STYLES[est].bg : 'transparent',
                        color: p.estado === est ? ESTADO_STYLES[est].text : '#475569',
                        border: `1px solid ${p.estado === est ? ESTADO_STYLES[est].text + '40' : '#1e2d4a'}`,
                      }}
                    >
                      {ESTADO_STYLES[est].label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div
          className="rounded-xl p-8 text-center"
          style={{ background: '#111827', border: '1px solid #1e2d4a' }}
        >
          <p className="text-sm" style={{ color: '#475569' }}>No hay pedidos registrados.</p>
          <p className="text-xs mt-1" style={{ color: '#334155' }}>Presioná "Hacer pedido" para agregar uno.</p>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: '#00000080' }}>
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl p-6 w-full max-w-md flex flex-col gap-4"
            style={{ background: '#111827', border: '1px solid #1e2d4a' }}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base" style={{ color: '#e2e8f0' }}>📦 Nuevo pedido</h2>
              <button type="button" onClick={() => setModalOpen(false)} style={{ color: '#64748b' }}>✕</button>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs" style={{ color: '#64748b' }}>Proveedor</label>
              <input
                type="text"
                placeholder="Ej: Electrodistribuidora SA"
                value={proveedor}
                onChange={e => setProveedor(e.target.value)}
                className="rounded-lg px-3 py-2 text-sm"
                style={{ background: '#1a2236', border: '1px solid #1e2d4a', color: '#e2e8f0' }}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs" style={{ color: '#64748b' }}>Descripción del pedido *</label>
              <textarea
                rows={3}
                required
                placeholder="Ej: 50 cañerías 3/4, 200 caños EMT 1/2, tableros monofásicos…"
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                className="rounded-lg px-3 py-2 text-sm resize-none"
                style={{ background: '#1a2236', border: '1px solid #1e2d4a', color: '#e2e8f0' }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs" style={{ color: '#64748b' }}>Monto estimado ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={monto}
                  onChange={e => setMonto(e.target.value)}
                  className="rounded-lg px-3 py-2 text-sm"
                  style={{ background: '#1a2236', border: '1px solid #1e2d4a', color: '#e2e8f0' }}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs" style={{ color: '#64748b' }}>Fecha</label>
                <input
                  type="date"
                  value={fecha}
                  onChange={e => setFecha(e.target.value)}
                  className="rounded-lg px-3 py-2 text-sm"
                  style={{ background: '#1a2236', border: '1px solid #1e2d4a', color: '#e2e8f0' }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs" style={{ color: '#64748b' }}>Tipo</label>
              <div className="flex gap-2">
                {(['inversion', 'gasto'] as TipoPedido[]).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipo(t)}
                    className="flex-1 rounded-lg py-2 text-sm font-medium transition-all"
                    style={{
                      background: tipo === t
                        ? (t === 'inversion' ? '#1e3a5f' : '#2d1b0e')
                        : '#1a2236',
                      color: tipo === t
                        ? (t === 'inversion' ? '#60a5fa' : '#fb923c')
                        : '#64748b',
                      border: `1px solid ${tipo === t ? (t === 'inversion' ? '#3b82f6' : '#f97316') : '#1e2d4a'}`,
                    }}
                  >
                    {t === 'inversion' ? '📈 Inversión' : '💸 Gasto'}
                  </button>
                ))}
              </div>
              <p className="text-xs" style={{ color: '#475569' }}>
                {tipo === 'inversion' ? 'Stock, equipos o materiales que quedan en la empresa' : 'Consumible o servicio que se usa en el pedido'}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex-1 rounded-lg py-2 text-sm font-medium"
                style={{ background: '#1a2236', color: '#94a3b8', border: '1px solid #1e2d4a' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-lg py-2 text-sm font-bold transition-opacity disabled:opacity-50"
                style={{ background: '#1A6FD4', color: '#fff' }}
              >
                {saving ? 'Guardando…' : 'Confirmar pedido'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
