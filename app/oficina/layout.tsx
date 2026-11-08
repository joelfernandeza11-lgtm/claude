import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Oficina de Producto',
  description: 'Asistente virtual para investigar mercados, competencia y referencias antes de crear una marca ecommerce.',
};

export default function OficinaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
