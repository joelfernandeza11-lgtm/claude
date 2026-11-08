# Oficina de Producto

Asistente virtual (no es un chat) para investigar mercados ecommerce **antes** de crear una marca. Vive en `/oficina`.

**Flujo:** un asistente guiado en 5 pasos (dolor → formatos → mercados → calidad → lanzar) arma el brief. Al lanzar, se abre una "oficina" con **un agente por mercado**, todos buscando en paralelo en la web y mostrando en vivo qué buscan y qué fuentes leen. Los resultados se fusionan y deduplican entre mercados.

**Qué devuelve:** marcas DTC con tienda/landing propia, clasificadas por formato (cápsulas, gomitas, shampoo, sérums…), con señales de Meta Ads y Amazon, un puntaje auditable, mapa de formatos × mercados, análisis de oportunidades, shortlist exportable a CSV y una "investigación a fondo" por marca.

**Honestidad sobre Meta Ads:** la Biblioteca de Anuncios de Meta no se puede consultar de forma automática (es JavaScript y requiere sesión), así que el agente marca *confirmado / probable / verificar* según la evidencia que encuentra, y cada tarjeta trae un enlace ya filtrado a la Ad Library para confirmarlo en 1 clic.

## Configuración

```bash
cp .env.example .env.local   # y completá ANTHROPIC_API_KEY
npm install
npm run dev                  # http://localhost:3000/oficina
```

Sin `ANTHROPIC_API_KEY` podés probar la interfaz con el botón **"Probar con datos de demo"** (datos ilustrativos, no verificados).

Variables: `ANTHROPIC_API_KEY`, `OFICINA_MODEL` (default `claude-opus-5-5`), `OFICINA_ACCESS_CODE` (protege los endpoints; recomendado en producción porque cada búsqueda consume créditos).

## Estructura

- `app/oficina` — página; `components/oficina/*` — asistente, sala de búsqueda, resultados, investigación a fondo.
- `app/api/oficina/{search,synthesis,deepdive}` — endpoints (streaming NDJSON para búsqueda y deep dive).
- `lib/oficina/*` — tipos y catálogos (`types.ts`), prompts y agentes (`server.ts`), puntaje (`score.ts`), enlaces de verificación (`links.ts`).

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
