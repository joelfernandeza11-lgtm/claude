'use client';

import Link from 'next/link';
import { BoltIcon, TableCellsIcon, ViewColumnsIcon, BellAlertIcon, ChartBarIcon } from '@heroicons/react/24/outline';

interface HeaderProps {
  view: 'table' | 'kanban';
  onViewChange: (v: 'table' | 'kanban') => void;
  overdueCount: number;
  onAddLead: () => void;
}

export default function Header({ view, onViewChange, overdueCount, onAddLead }: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-40 border-b flex items-center gap-3 px-4 py-3"
      style={{ background: '#0d1526', borderColor: '#1e2d4a' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 mr-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: '#1A6FD4' }}
        >
          <BoltIcon className="w-5 h-5 text-white" />
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-semibold leading-none" style={{ color: '#e2e8f0' }}>
            Agile Electric
          </p>
          <p className="text-xs leading-none mt-0.5" style={{ color: '#64748b' }}>
            CRM
          </p>
        </div>
      </div>

      {/* View toggle */}
      <div
        className="flex rounded-lg p-0.5 gap-0.5"
        style={{ background: '#111827', border: '1px solid #1e2d4a' }}
      >
        <button
          onClick={() => onViewChange('table')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
          style={
            view === 'table'
              ? { background: '#1A6FD4', color: '#fff' }
              : { color: '#64748b' }
          }
        >
          <TableCellsIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Tabla</span>
        </button>
        <button
          onClick={() => onViewChange('kanban')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
          style={
            view === 'kanban'
              ? { background: '#1A6FD4', color: '#fff' }
              : { color: '#64748b' }
          }
        >
          <ViewColumnsIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Kanban</span>
        </button>
      </div>

      {/* Overdue alerts */}
      {overdueCount > 0 && (
        <div
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: '#7c2d12', color: '#fca5a5' }}
        >
          <BellAlertIcon className="w-4 h-4" />
          <span>{overdueCount} seguimiento{overdueCount > 1 ? 's' : ''} vencido{overdueCount > 1 ? 's' : ''}</span>
        </div>
      )}

      <div className="ml-auto flex items-center gap-2">
        <Link
          href="/negocio"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
          style={{ background: '#111827', color: '#94a3b8', border: '1px solid #1e2d4a' }}
        >
          <ChartBarIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Negocio</span>
        </Link>
        <button
          onClick={onAddLead}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 active:opacity-75"
          style={{ background: '#1A6FD4' }}
        >
          + Nuevo lead
        </button>
      </div>
    </header>
  );
}
