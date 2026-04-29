import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Agile Electric CRM',
  description: 'CRM para Agile Electric — infraestructura eléctrica',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full flex flex-col" style={{ background: '#0A0F1E', color: '#e2e8f0' }}>
        {children}
      </body>
    </html>
  );
}
