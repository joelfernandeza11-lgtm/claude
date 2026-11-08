# Atlas — Oficina de inteligencia de producto

Una "oficina virtual" para investigar mercados ecommerce de todo el mundo **antes** de crear una marca. Vive en `/oficina`.

**Cómo se usa:** no es un formulario ni un chat. Contás el dolor que querés resolver y Atlas te lleva, ronda a ronda, hasta un producto concreto:

1. **Radar global** — un analista por mercado busca en paralelo (se ve la oficina, el mapa y las búsquedas en vivo). Atlas devuelve *conclusiones* (qué está saturado, qué hueco hay, qué ángulos se repiten) y 3–4 direcciones de producto. Elegís una, o le decís hacia dónde ir.
2. **Foco** — nueva búsqueda enfocada en esa dirección: competencia directa, precios, ofertas y voz del cliente (reseñas).
3. **Definición** — Atlas propone paquetes de público, precio y oferta.
4. **Concepto** — ficha del producto + plan de validación barato (descargable en Markdown).

En cada paso podés volver atrás. Las marcas que respaldan las conclusiones están en el panel de *Evidencia*: puntaje auditable, señales de Meta Ads y Amazon, mapa de formatos × mercados, shortlist y CSV, e "Investigar a fondo" por marca.

**Honestidad sobre Meta Ads:** la Biblioteca de Anuncios de Meta no se puede consultar de forma automática, así que cada marca se marca como *confirmado / probable / verificar* según la evidencia hallada, con un enlace ya filtrado para confirmarlo en 1 clic. Cada hallazgo de Atlas indica si es *evidencia* o *inferencia*.

## Configuración

```bash
cp .env.example .env.local   # y completá ANTHROPIC_API_KEY
npm install
npm run dev                  # http://localhost:3000/oficina
```

Sin `ANTHROPIC_API_KEY` podés recorrer las 4 rondas con **"Ver una demo guiada"** (datos y conclusiones ilustrativos, no verificados).

Variables: `ANTHROPIC_API_KEY`, `OFICINA_MODEL` (default `claude-opus-5-5`), `OFICINA_ACCESS_CODE` (protege los endpoints; recomendado en producción porque cada búsqueda consume créditos).

## Estructura

- `app/oficina` — página y animaciones (`office.css`); `components/oficina/*` — escena animada (`OfficeScene`), entrada, equipo de analistas, conclusiones, dossier, evidencia.
- `app/api/oficina/{search,discover,deepdive}` — búsqueda (streaming NDJSON, un agente por mercado), cerebro de Atlas por etapa, investigación a fondo.
- `lib/oficina/*` — tipos y catálogos (`types.ts`), prompts y agentes (`server.ts`), mapamundi (`world.ts`), puntaje (`score.ts`), enlaces (`links.ts`), demo (`demo.ts`).

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
