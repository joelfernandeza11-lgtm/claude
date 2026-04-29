'use client';

import { useState, useMemo } from 'react';
import {
  ChevronUpDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  PencilIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Lead, Estado, STATUS_COLORS } from '@/lib/types';
import { isOverdue } from '@/lib/utils';

interface LeadsTableProps {
  leads: Lead[];
  onEdit: (lead: Lead) => void;
}

type SortKey = keyof Lead | null;

function StatusBadge({ estado }: { estado: Estado }) {
  const c = STATUS_COLORS[estado];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {estado}
    </span>
  );
}

export default function LeadsTable({ leads, onEdit }: LeadsTableProps) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('fecha_ingreso');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let arr = leads.filter(
      (l) =>
        l.nombre.toLowerCase().includes(q) ||
        l.empresa.toLowerCase().includes(q) ||
        l.zona.toLowerCase().includes(q)
    );
    if (sortKey) {
      arr = [...arr].sort((a, b) => {
        const av = a[sortKey] ?? '';
        const bv = b[sortKey] ?? '';
        const cmp = String(av).localeCompare(String(bv));
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return arr;
  }, [leads, search, sortKey, sortDir]);

  const SortIcon = ({ k }: { k: string }) => {
    if (sortKey !== k) return <ChevronUpDownIcon className="w-3.5 h-3.5 opacity-40" />;
    return sortDir === 'asc'
      ? <ChevronUpIcon className="w-3.5 h-3.5" style={{ color: '#1A6FD4' }} />
      : <ChevronDownIcon className="w-3.5 h-3.5" style={{ color: '#1A6FD4' }} />;
  };

  const TH = ({ label, k }: { label: string; k: string }) => (
    <th
      className="px-3 py-2.5 text-left text-xs font-medium cursor-pointer select-none whitespace-nowrap"
      style={{ color: '#64748b' }}
      onClick={() => handleSort(k as SortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <SortIcon k={k} />
      </span>
    </th>
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 px-4 pb-4">
      {/* Search */}
      <div className="mb-3 relative">
        <MagnifyingGlassIcon
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          style={{ color: '#64748b' }}
        />
        <input
          className="w-full sm:w-72 pl-9 pr-3 py-2 rounded-lg text-sm placeholder-slate-500 focus:outline-none focus:ring-2"
          style={{ background: '#111827', border: '1px solid #1e2d4a', color: '#e2e8f0', '--tw-ring-color': '#1A6FD4' } as React.CSSProperties}
          placeholder="Buscar por nombre, empresa, zona…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table wrapper */}
      <div
        className="flex-1 overflow-auto rounded-xl"
        style={{ border: '1px solid #1e2d4a' }}
      >
        <table className="w-full border-collapse text-sm min-w-[900px]">
          <thead style={{ background: '#0d1526', position: 'sticky', top: 0, zIndex: 1 }}>
            <tr>
              <TH label="Nombre" k="nombre" />
              <TH label="Empresa" k="empresa" />
              <TH label="Tipo proyecto" k="tipo_proyecto" />
              <TH label="Zona" k="zona" />
              <TH label="Escala" k="escala" />
              <TH label="Canal" k="canal" />
              <TH label="Estado" k="estado" />
              <TH label="Ingreso" k="fecha_ingreso" />
              <TH label="Últ. contacto" k="ultimo_contacto" />
              <th className="px-3 py-2.5 text-xs font-medium text-left" style={{ color: '#64748b' }}>
                Notas
              </th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={11} className="text-center py-16 text-sm" style={{ color: '#64748b' }}>
                  {search ? 'No hay resultados para esa búsqueda.' : 'Aún no hay leads. ¡Crea el primero!'}
                </td>
              </tr>
            )}
            {filtered.map((lead) => {
              const overdue = isOverdue(lead);
              return (
                <tr
                  key={lead.id}
                  className="border-t cursor-pointer group"
                  style={{ borderColor: '#1e2d4a' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#131d33'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}
                  onClick={() => onEdit(lead)}
                >
                  <td className="px-3 py-3 font-medium whitespace-nowrap" style={{ color: '#e2e8f0' }}>
                    <span className="flex items-center gap-1.5">
                      {lead.nombre}
                      {overdue && (
                        <ExclamationTriangleIcon
                          className="w-3.5 h-3.5 flex-shrink-0"
                          style={{ color: '#f59e0b' }}
                          title="Seguimiento vencido (+7 días sin contacto)"
                        />
                      )}
                    </span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap" style={{ color: '#94a3b8' }}>
                    {lead.empresa || <span style={{ color: '#334155' }}>—</span>}
                  </td>
                  <td className="px-3 py-3 max-w-[160px] truncate" style={{ color: '#94a3b8' }}>
                    {lead.tipo_proyecto || <span style={{ color: '#334155' }}>—</span>}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap" style={{ color: '#94a3b8' }}>
                    {lead.zona || <span style={{ color: '#334155' }}>—</span>}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-xs" style={{ color: '#94a3b8' }}>
                    {lead.escala}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-xs" style={{ color: '#94a3b8' }}>
                    {lead.canal}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <StatusBadge estado={lead.estado} />
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-xs" style={{ color: '#64748b' }}>
                    {lead.fecha_ingreso}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-xs" style={{ color: overdue ? '#f59e0b' : '#64748b' }}>
                    {lead.ultimo_contacto ?? <span style={{ color: '#334155' }}>—</span>}
                  </td>
                  <td
                    className="px-3 py-3 max-w-[180px] truncate text-xs"
                    style={{ color: '#64748b' }}
                    title={lead.notas}
                  >
                    {lead.notas || <span style={{ color: '#334155' }}>—</span>}
                  </td>
                  <td className="px-3 py-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); onEdit(lead); }}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: '#64748b' }}
                      title="Editar"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs mt-2" style={{ color: '#334155' }}>
        {filtered.length} lead{filtered.length !== 1 ? 's' : ''}
        {search ? ` de ${leads.length}` : ''}
      </p>
    </div>
  );
}
