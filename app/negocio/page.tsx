'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  RegistroDiario, RegistroDiarioInput,
  Costo, CostoInput,
  Pedido, PedidoInput, EstadoPedido,
} from '@/lib/types';
import ResumenCards from '@/components/negocio/ResumenCards';
import DailyForm from '@/components/negocio/DailyForm';
import CostosPanel from '@/components/negocio/CostosPanel';
import PedidosPanel from '@/components/negocio/PedidosPanel';

export default function NegocioPage() {
  const [registros, setRegistros] = useState<RegistroDiario[]>([]);
  const [costos, setCostos]       = useState<Costo[]>([]);
  const [pedidos, setPedidos]     = useState<Pedido[]>([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState<'costos' | 'pedidos'>('costos');

  const fetchAll = useCallback(async () => {
    const [r, c, p] = await Promise.all([
      supabase.from('registros_diarios').select('*').order('fecha', { ascending: false }),
      supabase.from('costos').select('*').order('created_at', { ascending: false }),
      supabase.from('pedidos').select('*').order('created_at', { ascending: false }),
    ]);
    if (r.data) setRegistros(r.data as RegistroDiario[]);
    if (c.data) setCostos(c.data as Costo[]);
    if (p.data) setPedidos(p.data as Pedido[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();

    const channels = [
      supabase.channel('neg-registros').on('postgres_changes', { event: '*', schema: 'public', table: 'registros_diarios' }, fetchAll).subscribe(),
      supabase.channel('neg-costos').on('postgres_changes', { event: '*', schema: 'public', table: 'costos' }, fetchAll).subscribe(),
      supabase.channel('neg-pedidos').on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, fetchAll).subscribe(),
    ];

    return () => { channels.forEach(ch => supabase.removeChannel(ch)); };
  }, [fetchAll]);

  // ── Registros diarios ───────────────────────────────────────────────────
  const handleSaveRegistro = async (data: RegistroDiarioInput) => {
    const { error } = await supabase
      .from('registros_diarios')
      .upsert([data], { onConflict: 'fecha' });
    if (error) throw error;
    await fetchAll();
  };

  // ── Costos ──────────────────────────────────────────────────────────────
  const handleAddCosto = async (data: CostoInput) => {
    const { error } = await supabase.from('costos').insert([data]);
    if (error) throw error;
    await fetchAll();
  };

  const handleDeleteCosto = async (id: string) => {
    await supabase.from('costos').delete().eq('id', id);
    await fetchAll();
  };

  // ── Pedidos ─────────────────────────────────────────────────────────────
  const handleAddPedido = async (data: PedidoInput) => {
    const { error } = await supabase.from('pedidos').insert([data]);
    if (error) throw error;
    await fetchAll();
  };

  const handleUpdateEstadoPedido = async (id: string, estado: EstadoPedido) => {
    await supabase.from('pedidos').update({ estado }).eq('id', id);
    await fetchAll();
  };

  const handleDeletePedido = async (id: string) => {
    await supabase.from('pedidos').delete().eq('id', id);
    await fetchAll();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#0A0F1E' }}>
        <div className="text-center">
          <div className="w-8 h-8 rounded-full border-2 animate-spin mx-auto mb-3"
            style={{ borderColor: '#1A6FD4', borderTopColor: 'transparent' }} />
          <p className="text-sm" style={{ color: '#64748b' }}>Cargando negocio…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0A0F1E' }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-4 py-3 sticky top-0 z-10"
        style={{ background: '#111827', borderBottom: '1px solid #1e2d4a' }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xs px-2 py-1 rounded-lg transition-colors"
            style={{ color: '#64748b', background: '#1a2236', border: '1px solid #1e2d4a' }}
          >
            ← CRM
          </Link>
          <div>
            <h1 className="font-bold text-sm" style={{ color: '#e2e8f0' }}>Gestión del Negocio</h1>
            <p className="text-xs" style={{ color: '#475569' }}>Agile Electric</p>
          </div>
        </div>
        <div className="text-xs px-2 py-1 rounded-full" style={{ background: '#1a2236', color: '#64748b' }}>
          {new Date().toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
        </div>
      </header>

      <main className="flex-1 p-4 flex flex-col gap-4 max-w-7xl mx-auto w-full">
        {/* Summary cards */}
        <ResumenCards registros={registros} costos={costos} pedidos={pedidos} />

        {/* Main grid */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Left: daily entry */}
          <div className="lg:col-span-1">
            <DailyForm registros={registros} onSave={handleSaveRegistro} />
          </div>

          {/* Right: costs + orders with tabs */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Tab bar */}
            <div
              className="flex gap-1 p-1 rounded-xl"
              style={{ background: '#111827', border: '1px solid #1e2d4a' }}
            >
              {([
                { id: 'costos',   label: 'Costos del negocio', badge: costos.length },
                { id: 'pedidos',  label: 'Pedidos a proveedor', badge: pedidos.filter(p => p.estado === 'pendiente').length },
              ] as const).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: activeTab === tab.id ? '#1a2236' : 'transparent',
                    color: activeTab === tab.id ? '#e2e8f0' : '#64748b',
                  }}
                >
                  {tab.label}
                  {tab.badge > 0 && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                      style={{ background: activeTab === tab.id ? '#1A6FD4' : '#1e2d4a', color: '#fff', minWidth: 20, textAlign: 'center' }}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {activeTab === 'costos' && (
              <CostosPanel
                costos={costos}
                onAdd={handleAddCosto}
                onDelete={handleDeleteCosto}
              />
            )}

            {activeTab === 'pedidos' && (
              <PedidosPanel
                pedidos={pedidos}
                onAdd={handleAddPedido}
                onUpdateEstado={handleUpdateEstadoPedido}
                onDelete={handleDeletePedido}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
