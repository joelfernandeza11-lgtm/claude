'use client';

import dynamic from 'next/dynamic';

// Se renderiza solo en el cliente: el estado inicial viene de localStorage.
const OficinaApp = dynamic(() => import('./OficinaApp'), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-[#0A0F1E]" />,
});

export default function OficinaLoader() {
  return <OficinaApp />;
}
