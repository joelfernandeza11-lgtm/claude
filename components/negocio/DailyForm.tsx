'use client';

import { useState } from 'react';
import { RegistroDiario, RegistroDiarioInput } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  registros: RegistroDiario[];
  onSave: (data: RegistroDiarioInput) => Promise<void>;
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);
}

export default function DailyForm({ registros, onSave }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const [fecha, setFecha] = useState(today);
  const [facturacion, setFacturacion] = useState('');
  const [ganancia, setGanancia] = useState('');
  const [notas, setNotas] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const existing = registros.find(r => r.fecha === fecha);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        fecha,
        facturacion: parseFloat(facturacion) || 0,
        ganancia: parseFloat(ganancia) || 0,
        notas,
      });
      setSaved(true);
      setFacturacion('');
      setGanancia('');
      setNotas('');
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const recent = [...registros].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 7);

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={handleSubmit}
        className="rounded-xl p-4 flex flex-col gap-3"
        style={{ background: '#111827', border: '1px solid #1e2d4a' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm" style={{ color: '#e2e8f0' }}>Carga del día</h2>
          {existing && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#1a2236', color: '#f59e0b' }}>
              Ya cargado — sobreescribirá
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs" style={{ color: '#64748b' }}>Fecha</label>
          <input
            type="date"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm w-full"
            style={{ background: '#1a2236', border: '1px solid #1e2d4a', color: '#e2e8f0' }}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: '#64748b' }}>Facturación ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              value={facturacion}
              onChange={e => setFacturacion(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm"
              style={{ background: '#1a2236', border: '1px solid #1e2d4a', color: '#e2e8f0' }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: '#64748b' }}>Ganancia ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              value={ganancia}
              onChange={e => setGanancia(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm"
              style={{ background: '#1a2236', border: '1px solid #1e2d4a', color: '#e2e8f0' }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs" style={{ color: '#64748b' }}>Notas del día</label>
          <textarea
            rows={2}
            placeholder="Ej: trabajo en zona norte, 2 instalaciones completadas…"
            value={notas}
            onChange={e => setNotas(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm resize-none"
            style={{ background: '#1a2236', border: '1px solid #1e2d4a', color: '#e2e8f0' }}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg py-2 text-sm font-semibold transition-opacity disabled:opacity-50"
          style={{ background: '#1A6FD4', color: '#fff' }}
        >
          {saved ? '✓ Guardado' : saving ? 'Guardando…' : 'Guardar registro'}
        </button>
      </form>

      {/* Recent records */}
      {recent.length > 0 && (
        <div
          className="rounded-xl p-4 flex flex-col gap-2"
          style={{ background: '#111827', border: '1px solid #1e2d4a' }}
        >
          <h3 className="text-xs font-semibold" style={{ color: '#64748b' }}>Últimos registros</h3>
          <div className="flex flex-col gap-1">
            {recent.map(r => (
              <div key={r.id} className="flex justify-between items-center py-1.5 border-b" style={{ borderColor: '#1e2d4a' }}>
                <div>
                  <p className="text-xs font-medium" style={{ color: '#e2e8f0' }}>
                    {format(new Date(r.fecha + 'T12:00:00'), "d 'de' MMM", { locale: es })}
                  </p>
                  {r.notas && <p className="text-xs" style={{ color: '#475569' }}>{r.notas}</p>}
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold" style={{ color: '#3b82f6' }}>{fmt(r.facturacion)}</p>
                  <p className="text-xs" style={{ color: '#10b981' }}>{fmt(r.ganancia)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
