# Lusarte Web — Audit y plan de acción

> Fecha: 2026-09-28 · Estado: planificación
>
> **Decisiones fijas:** dominio `lusarte.net` · pagos con **Wompi** (Colombia, COP) · hosting **Hostinger** con base de datos MySQL incluida en el plan.

## 1. Alcance

Base del paquete **Profesional** + extras de **Premium** + Resend.

| Incluido | Origen |
|---|---|
| Diseño con identidad de marca, catálogo de velas e insumos, botón de WhatsApp, responsive, alta en Google | Esencial |
| Tienda con carrito y pagos en línea | Profesional |
| Categorías y filtros | Profesional |
| Panel para que la clienta edite productos, precios y stock | Profesional |
| SEO completo + Google Business Profile | Profesional |
| **SEO avanzado + analítica de visitas** | Premium |
| **Emails transaccionales con Resend** (confirmación de pedido, aviso de pedido nuevo, cambios de estado, contacto) | Extra (cubre "Avisos automáticos de pedidos" de Premium) |

**Fuera de alcance (por ahora):** blog de tutoriales y sección de cursos/talleres. La arquitectura queda preparada para agregarlos después (rutas `/blog` y `/talleres` reservadas, esquema extensible).

---

## 2. Audit de assets

### 2.1 Inventario

| Archivo | Qué es | Estado para web | Acción |
|---|---|---|---|
| `LOGO.png` / `LogoNegro.png` | Logo horizontal carbón, con y sin tagline "ILUMINANDO TU VIDA" | 4500×4500 con ~70% de padding transparente | Recortar y exportar SVG |
| `LogoBlanco.png` / `LogoBlanco2.png` | Mismo logo en blanco, con / sin tagline | Igual | Recortar y exportar SVG |
| `LogoNegro3.png` / `LogoBlanco3.png` | Logo apilado "Lus / arte" | 2888×1594, bien recortado | SVG (para favicon / avatar / móvil) |
| `Patron.png` … `Patron4.png` | Patrón de íconos lineales en 4 colores (cielo, arena, oliva, lavanda) | 8000×4500, 388 KB c/u | **Reemplazar por 1 SVG (≈53 KB) recoloreable con CSS** |
| `Sticker2.png` | Arco oliva con vela + logo | 4500×4500 | WebP/SVG, usar como sello decorativo |
| `StickerCircular.png` | Sello circular arena "Iluminando tu vida" | 4500×4500 | SVG, candidato a badge animado (rotación lenta) |
| `Tijeras.png` / `Velita.png` | Stickers cielo / lavanda | 4500×4500 | SVG |
| `LusarteEditable.ai` | 3 artboards: patrón · brand board · póster + stickers a color + paleta | Vectorial (sin fuentes, todo en curvas) | Fuente de verdad para exportar |

**Hallazgo importante:** el artboard 3 del `.ai` contiene assets que **no están exportados** y son los más valiosos para la web:
- Póster "ILUMINANDO TU VIDA" con lettering outline azul sobre crema → ideal para el hero.
- 6 stickers ilustrados a color con borde blanco (tijeras, estrella sonriente, fósforo, vela ondulada, apagavelas) → decoración, estados vacíos, 404, emails.
- Franja con la paleta oficial.

### 2.2 Paleta de marca (extraída del `.ai`)

| Token | Hex | Uso propuesto |
|---|---|---|
| `crema` | `#EFEBE0` | Fondo principal (del póster) |
| `carbon` | `#383939` | Texto, logo, botones primarios |
| `arena` | `#BCA990` | Acento cálido, bordes, sello |
| `oliva` | `#AAA96C` | Categoría / acento secundario |
| `cielo` | `#8AA9C1` | Links, lettering, acento frío |
| `lavanda` | `#DCC5E0` | Highlights, badges, fondos de tarjeta |
| `miel` | `#F0CD88` | Acento de stickers (usar con moderación) |
| `estrella` | `#F5ECA0` | Acento de stickers (usar con moderación) |

Notas de accesibilidad: arena, oliva, cielo y lavanda **no tienen contraste suficiente** para texto sobre crema; se usan como superficies o decoración, con texto siempre en `carbon`.

### 2.3 Tipografía

No hay fuentes en los archivos (logo y tagline están en curvas). El tagline es una sans geométrica itálica en mayúsculas con tracking amplio. Propuesta a validar en Fase 1:
- **Títulos:** sans con carácter y ligeramente redondeada (candidatas: Bricolage Grotesque, Outfit).
- **Texto:** sans legible (candidatas: DM Sans, Inter).
- **Detalle de marca:** itálica mayúscula con tracking amplio, imitando el tagline, para eyebrows y etiquetas.
- El logo y el lettering del póster se usan siempre como SVG, nunca como fuente.

### 2.4 Lo que falta (bloquea fases posteriores, no la Fase 1)

| Falta | Bloquea | Prioridad |
|---|---|---|
| **Fotos de producto** (fondo neutro, luz natural, mismo encuadre) | Tienda, SEO de imágenes, Merchant Center | 🔴 Alta |
| **Catálogo**: nombres, descripciones, precios, categorías, variantes (aroma / tamaño / color), stock, peso para envíos | Fase 2 | 🔴 Alta |
| Fotos de ambiente / proceso / de la fundadora | Landing (se usan placeholders mientras) | 🟠 Media |
| Historia de marca / "Sobre nosotros" | Landing, E-E-A-T | 🟠 Media |
| Datos de contacto: WhatsApp, Instagram, ciudad/dirección, horarios, email | Footer, JSON-LD, Google Business | 🟠 Media |
| Acceso al panel de Hostinger (hPanel) y a la zona DNS de `lusarte.net` | Deploy, Resend, lanzamiento | 🟠 Media |
| Cuenta de Wompi (comercio verificado) con llaves de sandbox y producción | Fase 3 | 🟠 Media |
| Política de envíos, cambios y devoluciones, términos, tratamiento de datos | Checkout, lanzamiento | 🟠 Media |
| Testimonios / reseñas | Landing (sección opcional) | 🟢 Baja |

---

## 3. Stack y arquitectura

| Capa | Tecnología | Por qué |
|---|---|---|
| Framework | **Next.js 16** (App Router, TypeScript, Server Components), `output: "standalone"` | SSG/ISR para SEO, rutas dinámicas por producto; build liviano para Node en Hostinger |
| Estilos | **Tailwind CSS v4** + shadcn/ui (tokens de marca) | Sistema de diseño consistente, rápido |
| Hosting | **Hostinger — Web App Node.js** (plan Business o Cloud) | Deploy desde GitHub, precio fijo, dominio y DNS en el mismo panel |
| Base de datos | **MySQL / MariaDB de Hostinger** (incluida en el plan) | Catálogo, pedidos, sesiones del admin |
| ORM | **Drizzle ORM** + `mysql2` | Tipado, migraciones versionadas en el repo, liviano |
| Auth (solo admin) | **Better Auth** (email + contraseña, tablas en MySQL) | Login de la clienta al panel sin servicios externos |
| Imágenes | Carpeta persistente en el hosting + `next/image` (sharp) | Subida desde el panel, AVIF/WebP automático (ver riesgo 3.3) |
| Pagos | **Wompi** — Web Checkout / Widget: tarjetas, PSE, Nequi, Botón Bancolombia | Pasarela local en COP |
| Email | **Resend** + React Email, dominio `lusarte.net` | Plantillas con la marca |
| Analítica | GA4 + Google Search Console (+ Microsoft Clarity opcional) | Visitas, conversiones, búsquedas, mapas de calor |
| Entornos | `lusarte.net` (producción) · `dev.lusarte.net` (staging, segunda web app) | Revisión de la clienta antes de publicar |

### 3.1 Mapa del sitio

```
/                              Landing
/tienda                        Catálogo completo + filtros
/tienda/[categoria]            Velas, Insumos, … (landing SEO por categoría)
/producto/[slug]               Ficha de producto
/carrito
/checkout
/pedido/[id]                   Confirmación / estado
/nosotros
/contacto
/preguntas-frecuentes
/envios-y-devoluciones
/terminos · /privacidad
/admin                         Panel (protegido)
  /admin/productos · /admin/categorias · /admin/pedidos · /admin/ajustes
```

### 3.2 Modelo de datos (borrador)

- `categories` (slug, nombre, descripción SEO, imagen, orden)
- `products` (slug, nombre, descripción, categoría, precio base, activo, destacado, campos SEO)
- `product_variants` (producto, nombre p. ej. aroma/tamaño, precio, stock, SKU, peso)
- `product_images` (producto, url, alt, orden)
- `orders` (código, datos de cliente, dirección, total, envío, estado, referencia de pago)
- `order_items` (pedido, variante, cantidad, precio al momento)
- `settings` (WhatsApp, costo de envío, mensajes, redes)

Checkout como invitado (sin cuentas de cliente). El carrito vive en el cliente (localStorage) y se valida contra la base de datos al pagar. Precios guardados como enteros en COP (sin decimales).

### 3.3 Hostinger — requisitos y riesgos a verificar

1. **El plan debe soportar Node.js.** Solo los planes **Business** y **Cloud** corren apps Next.js; los planes Single/Premium de hosting compartido no. Verificar en hPanel antes de la Fase 1 (sección "Web Apps" / "Node.js").
2. **Recursos limitados** (CPU/RAM fijos): el build se hace en el deploy; se prioriza páginas estáticas/ISR y se evita trabajo pesado en cada request.
3. **Persistencia de archivos subidos:** un redeploy puede reemplazar la carpeta de la app. Las imágenes del panel se guardan en una carpeta fuera del directorio de build. Se prueba en la Fase 1; si no es confiable, el plan B es Cloudinary (gratis en este volumen).
4. **Sin cron nativo en la app:** la reconciliación de pagos se hace con el webhook de Wompi + consulta del estado de la transacción en la página de confirmación. Si hace falta, se usa el Cron Job de hPanel llamando a una ruta protegida.
5. **Variables de entorno** (llaves Wompi, Resend, DB, secreto de auth) se configuran en hPanel, nunca en el repo.
6. **Backups:** activar los backups diarios del plan e incluir la base de datos.

---

## 4. SEO avanzado

- Metadata por página (title, description, canonical a `https://lusarte.net`, sin `www`, con redirección 301 desde `www`), `lang="es-CO"`, `og:locale` `es_CO`.
- **Datos estructurados JSON-LD:** `Organization`, `LocalBusiness`/`Store`, `WebSite` + `SearchAction`, `Product` + `Offer` + `AggregateRating` (cuando haya reseñas), `BreadcrumbList`, `FAQPage`.
- `sitemap.xml` dinámico (productos y categorías) + `robots.txt`.
- Imágenes OG dinámicas por producto y categoría (`next/og`) con la marca.
- Core Web Vitals: LCP < 2.5 s, CLS < 0.1, INP < 200 ms (fuentes con `next/font`, SVG inline, imágenes optimizadas).
- URLs limpias en español, breadcrumbs, enlazado interno entre categorías y productos.
- Páginas de categoría con texto propio (no solo grilla) para posicionar "velas artesanales", "insumos para hacer velas", etc.
- Alt text obligatorio en el panel al subir imágenes.
- **Google Search Console** (verificación + sitemap), **Google Business Profile**, **feed de Google Merchant Center** (productos gratis en Google Shopping).
- **Analítica:** GA4 con eventos de e-commerce (`view_item`, `add_to_cart`, `begin_checkout`, `purchase`) y clic en WhatsApp; banner de consentimiento de cookies (Ley 1581).
- Rendimiento en Hostinger: HTTP/2, compresión, caché de estáticos (`/_next/static` inmutable), CDN de Hostinger si el plan lo incluye.

## 5. Resend — emails

| Email | Para | Disparador |
|---|---|---|
| Confirmación de pedido | Cliente | Webhook de pago aprobado |
| Pedido nuevo | Lusarte | Webhook de pago aprobado |
| Pedido enviado (con guía) | Cliente | Cambio de estado en el panel |
| Pago rechazado / pendiente | Cliente | Webhook de pago |
| Mensaje de contacto | Lusarte (reply-to al cliente) | Formulario de contacto |
| Alerta de stock bajo | Lusarte | Al descontar stock |

Remitente `pedidos@lusarte.net`. Verificar `lusarte.net` en Resend agregando en la zona DNS de Hostinger: DKIM (`resend._domainkey`), y MX + SPF en el subdominio `send`. Esto **no choca** con los buzones de correo de Hostinger (el MX raíz sigue siendo de Hostinger), así que Lusarte puede recibir respuestas en su correo normal. Agregar también un registro DMARC.

## 5.1 Wompi — integración

- **Widget / Web Checkout** con **firma de integridad** (SHA-256 de referencia + monto en centavos + moneda + secreto de integridad), generada en el servidor.
- **Webhook de eventos** (`transaction.updated`) en `/api/wompi/webhook`, validando el checksum del evento con el secreto de eventos; procesamiento idempotente por referencia.
- Página de confirmación que consulta el estado de la transacción en la API de Wompi (respaldo si el webhook tarda).
- Estados: `PENDING` → `APPROVED` / `DECLINED` / `VOIDED` / `ERROR`. El stock se descuenta solo en `APPROVED`.
- Pruebas completas en **sandbox** (tarjetas y PSE de prueba) antes de pasar a llaves de producción.

---

## 6. Plan de acción

### Fase 1 — Diseño de la landing ← **en revisión**

> **Estado (2026-09-28):** landing construida en Next.js 16 + Tailwind v4, solo frontend con datos de ejemplo (`src/data/sample.ts`). Assets exportados a `public/brand/` (logos inline en `src/components/brand/Logo.tsx`, patrón e íconos SVG recoloreables, stickers WebP). Originales movidos a `brand/originales/`. Pendiente: aprobación del diseño, deploy de staging.
1. Preparación de assets: recortar logos, exportar a SVG los logos, patrón (un solo SVG recoloreable), sellos y los 6 stickers a color del artboard 3; favicon y app icons desde el logo apilado.
2. Sistema de diseño: tokens de color, tipografía, espaciados, radios, botones, tarjetas de producto, badges.
3. Setup mínimo de Next.js + Tailwind para construir la landing como código real (no mockup desechable). Repo en GitHub conectado a una web app de staging en Hostinger (`dev.lusarte.net`), validando desde el día 1 que el build y el deploy funcionan en el plan.
4. Secciones de la landing:
   - **Header:** logo, navegación (Tienda, Velas, Insumos, Nosotros, Contacto), carrito.
   - **Hero:** lettering "Iluminando tu vida" del póster sobre crema + stickers flotando, CTA "Ver tienda".
   - **Categorías:** Velas / Insumos (tarjetas con los colores de marca).
   - **Productos destacados:** grilla con tarjeta de producto (datos de ejemplo).
   - **Hecho a mano:** historia corta de la marca + foto.
   - **Beneficios:** hecho a mano · envíos · pago seguro · atención por WhatsApp.
   - **Preguntas frecuentes** (acordeón, con `FAQPage`).
   - **CTA final** + botón flotante de WhatsApp.
   - **Footer:** sello circular, contacto, redes, links legales.
5. Responsive (móvil primero), animaciones sutiles (sello girando, stickers con parallax suave), accesibilidad AA.
6. Deploy en `dev.lusarte.net` para revisión con la clienta.

**Entregable:** landing navegable en `dev.lusarte.net`. **Checkpoint:** aprobación del diseño antes de seguir.

### Fase 2 — Base técnica y catálogo
- Base MySQL en Hostinger: esquema con Drizzle, migraciones, datos semilla; carpeta persistente de imágenes.
- `/tienda`, `/tienda/[categoria]` con filtros (categoría, precio, aroma/tipo, disponibilidad) y orden.
- `/producto/[slug]` con galería, variantes, stock y productos relacionados.
- Landing conectada a datos reales (destacados).

### Fase 3 — Carrito, checkout y pagos
- Carrito persistente, cálculo de envío, checkout como invitado.
- Integración con Wompi (ver 5.1): firma de integridad, webhook verificado, descuento de stock idempotente; pruebas en sandbox.
- Página de confirmación y estado de pedido.

### Fase 4 — Emails con Resend
- Plantillas React Email con la marca (stickers, paleta).
- Conectar a webhooks y cambios de estado; formulario de contacto.

### Fase 5 — Panel de administración
- Login de la clienta.
- CRUD de productos, variantes, imágenes (con alt obligatorio), categorías, precios y stock.
- Gestión de pedidos: listado, detalle, cambio de estado (dispara email), número de guía.
- Ajustes: WhatsApp, costo de envío, redes.

### Fase 6 — SEO avanzado y analítica
- JSON-LD completo, sitemap, OG dinámicas, textos de categorías.
- GA4 con eventos de e-commerce, Search Console, Merchant Center, Google Business Profile.
- Auditoría Lighthouse (objetivo ≥ 95 en Performance, SEO y Accesibilidad).

### Fase 7 — QA y lanzamiento
- Páginas legales para Colombia: tratamiento de datos (Ley 1581 de 2012), términos y condiciones, derecho de retracto y reversión del pago (Ley 1480 de 2011), política de envíos y devoluciones.
- Llaves de producción de Wompi, pruebas de compra reales de bajo monto, pruebas en móviles.
- Apuntar `lusarte.net` a la web app de producción, SSL, redirección `www` → raíz, DNS de Resend, backups activos, 404 con sticker.
- Capacitación a la clienta en el panel (guía corta).

---

## 7. Preguntas abiertas

1. **Hosting (por comprar)** — Decidido: **Node.js**. Candidatos:
   - **Hostinger Business Web Hosting** (recomendado): Node.js con hasta 5 web apps, MySQL, correo, backups diarios. Single/Premium **no** sirven.
   - **GoDaddy Web Hosting Económico** (COP 7.499/mes el 1er año → COP 36.999/mes al renovar): incluye **1 app Node.js publicada** con MySQL gestionado + 2 apps de preview (privadas, se borran a los 30 días). GA desde 2026-08-12 (el FAQ aún dice beta). Compatible con el stack: salida HTTPS para Wompi/Resend, sin SMTP (usamos la API de Resend), archivos persistentes solo en `/public/assets/`. Límites de CPU/RAM sin publicar. **Validar en los 30 días de reembolso** (checklist abajo).
     - Checklist de validación: build de Next.js en su plataforma · conexión a su MySQL · llamada HTTPS saliente a Wompi sandbox y a Resend · subir un archivo a `/public/assets/`, redeploy y confirmar que sigue ahí y se sirve · tiempo de respuesta desde Colombia · dominio `lusarte.net` + HTTPS · confirmar si el correo y el SSL "1 año" son gratis solo el primer año.
     - Staging: con una sola app publicada, la app de producción hace de staging (`noindex` + clave simple) hasta el lanzamiento.
   - **Namecheap VPS Pulsar**: más barato a largo plazo, pero autogestionado.

   **Regla de portabilidad:** el código debe correr igual en cualquiera de los tres: Next.js `standalone`, escuchar en `process.env.PORT` sobre `0.0.0.0`, MySQL vía `DATABASE_URL`, emails por la API HTTP de Resend (nunca SMTP), uploads en una ruta configurable por variable de entorno, dependencias de runtime en `dependencies`.
2. **Categorías reales** — ¿solo "Velas" e "Insumos" o hay subcategorías (moldes, ceras, mechas, esencias, recipientes, kits)?
3. **Envíos** — ¿tarifa fija, por ciudad, envío gratis desde un monto, recogida local?
4. **Fotos** — ¿existen fotos de producto o hay que planear una sesión?
