'use client';

import { useState } from 'react';
import { Costo, CostoInput, CATEGORIAS_COSTO, CATEGORIA_COLORS, CategoriasCosto } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  costos: Costo[];
  onAdd: (data: CostoInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);
}

export default function CostosPanel({ costos, onAdd, onDelete }: Props) {
  const [categoria, setCategoria] = useState<CategoriasCosto>('Materiales');
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [filterCat, setFilterCat] = useState<CategoriasCosto | 'Todas'>('Todas');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descripcion.trim() || !monto) return;
    setSaving(true);
    try {
      await onAdd({ categoria, descripcion: descripcion.trim(), monto: parseFloat(monto), fecha });
      setDescripcion('');
      setMonto('');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  // Breakdown per category
  const breakdown = CATEGORIAS_COSTO.map(cat => ({
    cat,
    total: costos.filter(c => c.categoria === cat).reduce((s, c) => s + Number(c.monto), 0),
  })).filter(b => b.total > 0).sort((a, b) => b.total - a.total);

  const totalCostos = costos.reduce((s, c) => s + Number(c.monto), 0);
  const maxVal = breakdown[0]?.total ?? 1;

  const filtered = filterCat === 'Todas'
    ? costos
    : costos.filter(c => c.categoria === filterCat);
  const sortedCostos = [...filtered].sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <div className="flex flex-col gap-4">
      {/* Add cost form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-xl p-4 flex flex-col gap-3"
        style={{ background: '#111827', border: '1px solid #1e2d4a' }}
      >
        <h2 className="font-semibold text-sm" style={{ color: '#e2e8f0' }}>Agregar costo</h2>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: '#64748b' }}>Categoría</label>
            <select
              value={categoria}
              onChange={e => setCategoria(e.target.value as CategoriasCosto)}
              className="rounded-lg px-3 py-2 text-sm"
              style={{ background: '#1a2236', border: '1px solid #1e2d4a', color: '#e2e8f0' }}
            >
              {CATEGORIAS_COSTO.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
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
          <label className="text-xs" style={{ color: '#64748b' }}>Descripción</label>
          <input
            type="text"
            placeholder="Ej: Sueldo junio — Juan"
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm"
            style={{ background: '#1a2236', border: '1px solid #1e2d4a', color: '#e2e8f0' }}
          />
        </div>

        <div className="flex gap-2">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs" style={{ color: '#64748b' }}>Monto ($)</label>
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
          <button
            type="submit"
            disabled={saving}
            className="self-end rounded-lg px-4 py-2 text-sm font-semibold transition-opacity disabled:opacity-50"
            style={{ background: '#1A6FD4', color: '#fff' }}
          >
            {saved ? '✓' : saving ? '…' : '+ Agregar'}
          </button>
        </div>
      </form>

      {/* Breakdown bars */}
      {breakdown.length > 0 && (
        <div
          className="rounded-xl p-4 flex flex-col gap-3"
          style={{ background: '#111827', border: '1px solid #1e2d4a' }}
        >
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-semibold" style={{ color: '#64748b' }}>Distribución de costos</h3>
            <span className="text-xs font-bold" style={{ color: '#f59e0b' }}>{fmt(totalCostos)} total</span>
          </div>
          <div className="flex flex-col gap-2">
            {breakdown.map(({ cat, total }) => (
              <div key={cat} className="flex flex-col gap-1">
                <div className="flex justify-between text-xs">
                  <span style={{ color: CATEGORIA_COLORS[cat] }}>{cat}</span>
                  <span style={{ color: '#94a3b8' }}>
                    {fmt(total)} · {((total / totalCostos) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: '#1a2236' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(total / maxVal) * 100}%`,
                      background: CATEGORIA_COLORS[cat],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Costs list */}
      {costos.length > 0 && (
        <div
          className="rounded-xl p-4 flex flex-col gap-3"
          style={{ background: '#111827', border: '1px solid #1e2d4a' }}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xs font-semibold" style={{ color: '#64748b' }}>Detalle</h3>
            <div className="flex gap-1 flex-wrap">
              {(['Todas', ...CATEGORIAS_COSTO] as const).map(cat => {
                const hasCosts = cat === 'Todas' || costos.some(c => c.categoria === cat);
                if (!hasCosts) return null;
                return (
                  <button
                    key={cat}
                    onClick={() => setFilterCat(cat)}
                    className="text-xs px-2 py-0.5 rounded-full transition-all"
                    style={{
                      background: filterCat === cat
                        ? (cat === 'Todas' ? '#1A6FD4' : CATEGORIA_COLORS[cat as CategoriasCosto])
                        : '#1a2236',
                      color: filterCat === cat ? '#fff' : '#64748b',
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
            {sortedCostos.map(c => (
              <div
                key={c.id}
                className="flex justify-between items-start py-2 border-b group"
                style={{ borderColor: '#1e2d4a' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: CATEGORIA_COLORS[c.categoria] }}
                    />
                    <span className="text-xs font-medium truncate" style={{ color: '#e2e8f0' }}>
                      {c.descripcion}
                    </span>
                  </div>
                  <p className="text-xs ml-3.5" style={{ color: '#475569' }}>
                    {c.categoria} · {format(new Date(c.fecha + 'T12:00:00'), "d MMM", { locale: es })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold" style={{ color: '#f59e0b' }}>{fmt(c.monto)}</span>
                  <button
                    onClick={() => onDelete(c.id)}
                    className="opacity-0 group-hover:opacity-100 text-xs transition-opacity"
                    style={{ color: '#ef4444' }}
                    title="Eliminar"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
