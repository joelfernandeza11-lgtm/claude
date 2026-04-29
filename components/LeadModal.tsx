'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Lead, LeadInput, ESCALAS, CANALES, ESTADOS } from '@/lib/types';

interface LeadModalProps {
  lead?: Lead | null;
  onClose: () => void;
  onSave: (data: LeadInput) => Promise<void>;
}

const today = () => new Date().toISOString().split('T')[0];

const empty: LeadInput = {
  nombre: '',
  empresa: '',
  tipo_proyecto: '',
  zona: '',
  escala: 'Chica <30k USD',
  canal: 'WhatsApp',
  estado: 'Nuevo',
  fecha_ingreso: today(),
  ultimo_contacto: null,
  notas: '',
};

const inputCls =
  'w-full rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2';
const inputStyle = { background: '#0d1526', border: '1px solid #1e2d4a', '--tw-ring-color': '#1A6FD4' } as React.CSSProperties;

export default function LeadModal({ lead, onClose, onSave }: LeadModalProps) {
  const [form, setForm] = useState<LeadInput>(lead ? { ...lead } : { ...empty, fecha_ingreso: today() });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const set = (k: keyof LeadInput, v: string | null) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave(form);
      onClose();
    } catch {
      setError('Error al guardar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full sm:max-w-2xl max-h-[95dvh] flex flex-col rounded-t-2xl sm:rounded-2xl overflow-hidden"
        style={{ background: '#111827', border: '1px solid #1e2d4a' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid #1e2d4a' }}
        >
          <h2 className="text-base font-semibold" style={{ color: '#e2e8f0' }}>
            {lead ? 'Editar lead' : 'Nuevo lead'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors hover:bg-slate-700"
            style={{ color: '#64748b' }}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nombre */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1" style={{ color: '#94a3b8' }}>
                Nombre *
              </label>
              <input
                className={inputCls}
                style={inputStyle}
                placeholder="Nombre del contacto"
                value={form.nombre}
                onChange={(e) => set('nombre', e.target.value)}
                autoFocus
              />
            </div>

            {/* Empresa */}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#94a3b8' }}>
                Empresa / Organización
              </label>
              <input
                className={inputCls}
                style={inputStyle}
                placeholder="Empresa"
                value={form.empresa}
                onChange={(e) => set('empresa', e.target.value)}
              />
            </div>

            {/* Tipo de proyecto */}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#94a3b8' }}>
                Tipo de proyecto
              </label>
              <input
                className={inputCls}
                style={inputStyle}
                placeholder="Ej: Instalación eléctrica industrial"
                value={form.tipo_proyecto}
                onChange={(e) => set('tipo_proyecto', e.target.value)}
              />
            </div>

            {/* Zona */}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#94a3b8' }}>
                Zona / Ubicación
              </label>
              <input
                className={inputCls}
                style={inputStyle}
                placeholder="Ciudad o región"
                value={form.zona}
                onChange={(e) => set('zona', e.target.value)}
              />
            </div>

            {/* Escala */}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#94a3b8' }}>
                Escala estimada
              </label>
              <select
                className={inputCls}
                style={inputStyle}
                value={form.escala}
                onChange={(e) => set('escala', e.target.value)}
              >
                {ESCALAS.map((e) => <option key={e}>{e}</option>)}
              </select>
            </div>

            {/* Canal */}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#94a3b8' }}>
                Canal de entrada
              </label>
              <select
                className={inputCls}
                style={inputStyle}
                value={form.canal}
                onChange={(e) => set('canal', e.target.value)}
              >
                {CANALES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>

            {/* Estado */}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#94a3b8' }}>
                Estado
              </label>
              <select
                className={inputCls}
                style={inputStyle}
                value={form.estado}
                onChange={(e) => set('estado', e.target.value)}
              >
                {ESTADOS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>

            {/* Fecha ingreso */}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#94a3b8' }}>
                Fecha de ingreso
              </label>
              <input
                type="date"
                className={inputCls}
                style={inputStyle}
                value={form.fecha_ingreso}
                onChange={(e) => set('fecha_ingreso', e.target.value)}
              />
            </div>

            {/* Último contacto */}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#94a3b8' }}>
                Último contacto
              </label>
              <input
                type="date"
                className={inputCls}
                style={inputStyle}
                value={form.ultimo_contacto ?? ''}
                onChange={(e) => set('ultimo_contacto', e.target.value || null)}
              />
            </div>

            {/* Notas */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1" style={{ color: '#94a3b8' }}>
                Notas
              </label>
              <textarea
                className={inputCls}
                style={{ ...inputStyle, resize: 'none' }}
                rows={3}
                placeholder="Observaciones, contexto, próximos pasos..."
                value={form.notas}
                onChange={(e) => set('notas', e.target.value)}
              />
            </div>
          </div>

          {/* Footer */}
          <div
            className="px-5 py-4 flex items-center justify-between gap-3 flex-shrink-0"
            style={{ borderTop: '1px solid #1e2d4a' }}
          >
            {error ? (
              <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>
            ) : (
              <span />
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ color: '#94a3b8', border: '1px solid #1e2d4a' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: '#1A6FD4' }}
              >
                {saving ? 'Guardando…' : lead ? 'Guardar cambios' : 'Crear lead'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
