'use client';

import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import { ExclamationTriangleIcon, PencilIcon } from '@heroicons/react/24/outline';
import { Lead, Estado, ESTADOS, STATUS_COLORS } from '@/lib/types';
import { isOverdue } from '@/lib/utils';

interface KanbanBoardProps {
  leads: Lead[];
  onEdit: (lead: Lead) => void;
  onStatusChange: (id: string, newStatus: Estado) => Promise<void>;
}

function KanbanCard({ lead, onEdit, overlay = false }: { lead: Lead; onEdit: (l: Lead) => void; overlay?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id });
  const overdue = isOverdue(lead);
  const c = STATUS_COLORS[lead.estado];

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="rounded-xl p-3 mb-2 cursor-grab active:cursor-grabbing select-none"
      style={{
        background: '#111827',
        border: `1px solid #1e2d4a`,
        opacity: isDragging && !overlay ? 0.4 : 1,
        touchAction: 'none',
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium leading-tight" style={{ color: '#e2e8f0' }}>
          {lead.nombre}
          {overdue && (
            <ExclamationTriangleIcon
              className="inline w-3.5 h-3.5 ml-1 align-text-bottom"
              style={{ color: '#f59e0b' }}
            />
          )}
        </p>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onEdit(lead); }}
          className="p-1 rounded flex-shrink-0 transition-colors hover:bg-slate-700"
          style={{ color: '#64748b' }}
        >
          <PencilIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      {lead.empresa && (
        <p className="text-xs mb-1.5" style={{ color: '#64748b' }}>{lead.empresa}</p>
      )}

      <div className="flex flex-wrap gap-1.5 mt-2">
        {lead.tipo_proyecto && (
          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#0d1526', color: '#64748b' }}>
            {lead.tipo_proyecto}
          </span>
        )}
        {lead.zona && (
          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#0d1526', color: '#64748b' }}>
            {lead.zona}
          </span>
        )}
        <span
          className={`text-xs px-1.5 py-0.5 rounded ${c.bg} ${c.text}`}
          style={{ marginLeft: 'auto' }}
        >
          {lead.escala.split(' ')[0]}
        </span>
      </div>

      {lead.ultimo_contacto && (
        <p className="text-xs mt-2" style={{ color: overdue ? '#f59e0b' : '#475569' }}>
          Últ. contacto: {lead.ultimo_contacto}
        </p>
      )}
    </div>
  );
}

function KanbanColumn({
  estado,
  leads,
  onEdit,
}: {
  estado: Estado;
  leads: Lead[];
  onEdit: (l: Lead) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: estado });
  const c = STATUS_COLORS[estado];

  return (
    <div className="flex flex-col w-64 flex-shrink-0">
      {/* Column header */}
      <div
        className="flex items-center justify-between px-3 py-2 rounded-t-xl mb-0"
        style={{ background: '#0d1526', border: '1px solid #1e2d4a', borderBottom: 'none' }}
      >
        <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#e2e8f0' }}>
          <span className={`w-2 h-2 rounded-full ${c.dot}`} />
          {estado}
        </span>
        <span
          className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
          style={{ background: '#1e2d4a', color: '#64748b' }}
        >
          {leads.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className="flex-1 min-h-[120px] rounded-b-xl p-2 overflow-y-auto"
        style={{
          background: isOver ? '#131d33' : '#0d1526',
          border: `1px solid ${isOver ? '#1A6FD4' : '#1e2d4a'}`,
          borderTop: 'none',
          maxHeight: 'calc(100vh - 280px)',
        }}
      >
        {leads.map((lead) => (
          <KanbanCard key={lead.id} lead={lead} onEdit={onEdit} />
        ))}
        {leads.length === 0 && (
          <p className="text-xs text-center py-6" style={{ color: '#334155' }}>
            Sin leads
          </p>
        )}
      </div>
    </div>
  );
}

export default function KanbanBoard({ leads, onEdit, onStatusChange }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const activeLead = activeId ? leads.find((l) => l.id === activeId) ?? null : null;

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id));
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const newStatus = String(over.id) as Estado;
    const lead = leads.find((l) => l.id === String(active.id));
    if (!lead || lead.estado === newStatus) return;
    await onStatusChange(lead.id, newStatus);
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 px-4 pb-4 overflow-x-auto" style={{ minHeight: 'calc(100vh - 220px)' }}>
        {ESTADOS.map((estado) => (
          <KanbanColumn
            key={estado}
            estado={estado}
            leads={leads.filter((l) => l.estado === estado)}
            onEdit={onEdit}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeLead && (
          <div style={{ width: 256, pointerEvents: 'none' }}>
            <KanbanCard lead={activeLead} onEdit={() => {}} overlay />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
