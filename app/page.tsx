'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Lead, LeadInput, Estado } from '@/lib/types';
import { isOverdue } from '@/lib/utils';
import Header from '@/components/Header';
import Dashboard from '@/components/Dashboard';
import LeadsTable from '@/components/LeadsTable';
import LeadModal from '@/components/LeadModal';
import KanbanBoard from '@/components/KanbanBoard';

export default function CRMPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setLeads(data as Lead[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLeads();

    const channel = supabase
      .channel('leads-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        fetchLeads();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchLeads]);

  const handleSave = async (data: LeadInput) => {
    if (editingLead) {
      const { error } = await supabase
        .from('leads')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', editingLead.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('leads').insert([data]);
      if (error) throw error;
    }
  };

  const handleStatusChange = async (id: string, newStatus: Estado) => {
    const { error } = await supabase
      .from('leads')
      .update({ estado: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) {
      setLeads((prev) =>
        prev.map((l) => (l.id === id ? { ...l, estado: newStatus } : l))
      );
    }
  };

  const openAdd = () => { setEditingLead(null); setModalOpen(true); };
  const openEdit = (lead: Lead) => { setEditingLead(lead); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditingLead(null); };

  const overdueCount = leads.filter(isOverdue).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#0A0F1E' }}>
        <div className="text-center">
          <div
            className="w-8 h-8 rounded-full border-2 animate-spin mx-auto mb-3"
            style={{ borderColor: '#1A6FD4', borderTopColor: 'transparent' }}
          />
          <p className="text-sm" style={{ color: '#64748b' }}>Cargando CRM…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#0A0F1E' }}>
      <Header
        view={view}
        onViewChange={setView}
        overdueCount={overdueCount}
        onAddLead={openAdd}
      />

      <Dashboard leads={leads} />

      <div className="flex-1 flex flex-col min-h-0">
        {view === 'table' ? (
          <LeadsTable leads={leads} onEdit={openEdit} />
        ) : (
          <KanbanBoard leads={leads} onEdit={openEdit} onStatusChange={handleStatusChange} />
        )}
      </div>

      {modalOpen && (
        <LeadModal
          lead={editingLead}
          onClose={closeModal}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
