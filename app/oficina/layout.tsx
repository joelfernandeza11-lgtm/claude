import type { Metadata } from 'next';
import './office.css';

export const metadata: Metadata = {
  title: 'Atlas — Oficina de inteligencia de producto',
  description: 'Atlas investiga mercados ecommerce de todo el mundo y te guía, ronda a ronda, desde un dolor del mercado hasta un concepto de producto validable.',
};

export default function OficinaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
