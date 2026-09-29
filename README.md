# Lusarte

Sitio web de **Lusarte** — velas artesanales e insumos para hacer velas. *Iluminando tu vida.*

Estado: **Fase 1 — diseño de la landing** (solo frontend, con datos de ejemplo). El plan completo está en [docs/PLAN.md](docs/PLAN.md).

## Stack

- [Next.js 16](https://nextjs.org) (App Router) + TypeScript
- Tailwind CSS v4 (tokens de marca en `src/app/globals.css`)

## Desarrollo

```bash
npm install
npm run dev
```

Abre <http://localhost:3000>.

```bash
npm run lint
npm run build
```

## Estructura

| Ruta | Contenido |
|---|---|
| `src/app/` | Layout, página de inicio y estilos globales |
| `src/components/home/` | Secciones de la landing (hero, categorías, productos, historia, pasos, FAQ) |
| `src/components/layout/` | Header, menú móvil y footer |
| `src/components/ui/` | Piezas reutilizables (botones, tarjetas, marcos tipo sticker, íconos) |
| `src/data/catalog.ts` | Taxonomía real de categorías |
| `src/data/sample.ts` | Productos destacados y preguntas frecuentes (provisionales) |
| `src/lib/site.ts` | Datos de contacto y menú |
| `public/brand/` | Assets de marca exportados para web (SVG/WebP) |
| `assets/` | Fotos y fichas de producto de la clienta |

## Pendiente antes del lanzamiento

- Reemplazar el número de WhatsApp y el usuario de Instagram en `src/lib/site.ts`.
- Confirmar las respuestas de preguntas frecuentes y el texto de "Nuestra historia".
- Fotos de producto en alta resolución (las actuales son de ~256 px).
- Quitar `robots: noindex` en `src/app/layout.tsx` cuando el sitio salga en `lusarte.net`.
