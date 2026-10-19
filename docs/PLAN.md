# Lusarte Web — Plan de acción de la tienda virtual

> Actualizado: 2026-10-08 · Estado: **Fases 1, 4 y 5 hechas en local**; la fase 3 queda a medias hasta que exista el hosting (GoDaddy, se compra el 2026-10-08).
>
> **Decisiones fijas:** dominio `lusarte.net` · pagos con **Wompi** (Colombia, COP) · Next.js + MySQL, portable entre hostings (hosting por comprar; mientras tanto, previews en Vercel) · correos con **Brevo** (antes Resend).

Lusarte es ante todo una **tienda virtual**: todo el sitio existe para que alguien encuentre un producto, lo pague en línea y lo reciba en su casa. La landing y las páginas informativas acompañan, pero la prioridad es el recorrido catálogo → carrito → pago → despacho.

## 0. Estado y lo que falta

> **Cambio de rumbo (2026-10-17): integración con Effi ERP.** Effi es la fuente de verdad de productos, precios, stock y ventas; la tienda y el panel son una capa encima (fotos, descripciones, visibilidad). Detalle en `docs/EFFI.md`. Se borró el catálogo transcrito del Canva.

| Fase | Estado |
|---|---|
| 1. Landing | ✅ Publicada en GoDaddy (hero con foto y vela que se enciende sola) |
| 2. Decisiones y cuentas | 🟡 GoDaddy ✅ · Effi ✅ · faltan Wompi, Resend, DNS y el valor del envío |
| 3. Base técnica | ✅ MySQL + migraciones · sincronización con Effi (artículos cada 15 min y ventas) |
| 4. Panel | ✅ Estadísticas de ventas (Effi), estado de la sincronización, productos con capa web (fotos, descripción, visibilidad, precio que se envía a Effi, agrupar/separar presentaciones) |
| 5. Tienda pública | ✅ Catálogo de Effi: 518 productos, precios y stock reales |
| 6. Carrito, checkout y pagos | 🟡 Hecho: carrito (localStorage + mini carrito), `/checkout`, pedidos (`orders`), Wompi Web Checkout con firma, webhook `/api/wompi/webhook`, `/pedido/[codigo]` con respaldo por API, `/admin/pedidos` (solo lectura). Probado en sandbox. Remisión automática en Effi + comprobante PDF en los correos (`docs/EFFI.md` → Remisiones de la tienda). Falta: valor real del envío y llaves de producción |
| 7. Correos | ✅ Brevo con la marca (tema claro/oscuro), registro en `email_log`, vista previa y reenvío en el panel (`docs/CORREOS.md`). Falta la API key y autenticar `lusarte.net` en Brevo |
| 8. Despacho | ✅ Formulario Despachar (transportadora, guía, rastreo, nota) → correo al cliente; corrección de guía y reenvío; seguimiento en `/pedido/[codigo]` |
| Envíos (2026-10-19) | ✅ Políticas de Lusarte: domicilio por ciudad (Panel → Envíos) con hora de corte, días y festivos; recoger en el punto de entrega; contraentrega "por confirmar" en ciudades locales; envío nacional con flete al cobro. Panel con pestañas Despacho local / nacional. Páginas `/envios-y-devoluciones` y `/como-comprar` con el texto de la dueña |
| 9 y 10 | ⬜ Pendientes |

**⚠️ Lo que falta para seguir** (en orden):

1. **Subir a GoDaddy** el zip nuevo y el `.sql` nuevo, y agregar el secreto `EFFI_API_KEY`.
2. **Llaves de prueba de Wompi** (`WOMPI_PUBLIC_KEY`, `WOMPI_INTEGRITY_SECRET`, `WOMPI_EVENTS_SECRET`) y la URL de eventos `https://<dominio>/api/wompi/webhook` en el dashboard. Sin llaves el checkout queda apagado y el carrito ofrece pedir por WhatsApp. **Tarifas de domicilio** por ciudad en Panel → Envíos (hoy $8.000 provisional).
3. ~~Cuenta de Effi para Wompi~~: Nequi (definido el 2026-10-19).
4. **Fotos y descripciones:** ningún artículo de Effi tiene foto ni descripción. Se cargan desde el panel (filtros "Sin foto" y "Sin descripción").
5. **Revisar la agrupación** de presentaciones en el panel (algunos artículos están duplicados en Effi, p. ej. "MOLDE LEON").
6. **"Molde Cactus"** no tiene categoría en Effi: está oculto hasta que se le asigne.
7. **Brevo:** `BREVO_API_KEY`, `ADMIN_EMAIL` y los registros DNS de `lusarte.net` (DKIM, DMARC, SPF) según `docs/CORREOS.md`. El PDF de la remisión al admin queda para cuando exista la remisión en Effi.
8. **Textos provisionales** (nosotros, envíos, términos, privacidad) y datos legales (razón social, NIT, ciudad: la sucursal de Effi está en Barranquilla).
9. **API key de Effi:** vence a los 360 días (renovar en Administración → Usuarios). El panel muestra el error si Effi la rechaza.

## 1. Alcance: paquete Profesional

| Ítem del paquete | Cómo se cumple |
|---|---|
| Todo lo Esencial: diseño con la marca, catálogo, botón de WhatsApp, adaptada a celular, SEO básico y alta en Google | Landing hecha; catálogo y WhatsApp en cada ficha de producto |
| Tienda con carrito y pagos en línea | Carrito, checkout como invitado y pago con Wompi (tarjeta, PSE, Nequi, Bancolombia) |
| Categorías y filtros | 6 categorías con subcategorías + colección Navidad; filtros y búsqueda |
| Tú misma editas productos y precios | **Panel sencillo: productos e imágenes, y nada más** (ver §3) |
| SEO completo + Google Business Profile | Ver §8 |

**Agregado a pedido de la clienta:**
- **Despacho con número de guía** desde el panel, que envía al cliente un correo con los datos del envío.
- **Correos de venta**: confirmación para el cliente y aviso de venta nueva para Lusarte.

**Fuera de alcance:** blog y talleres (Premium), cuentas de cliente, cupones, reseñas, editar categorías o ajustes desde el panel, cotización de envío en línea o integración con transportadoras y facturación electrónica DIAN. El plan anterior incluía SEO avanzado y analítica (extras Premium); con este alcance quedan como opcionales al final (Fase 9).

---

## 2. Mapa del sitio

### 2.1 Tienda (público)

| Ruta | Página | Qué tiene |
|---|---|---|
| `/` | Inicio | Hero "Enciéndela", categorías, Navidad, destacados, historia, guía, FAQ. **Hecha**; los destacados pasan a salir de la base de datos |
| `/tienda` | Todo el catálogo | Grilla con filtros (categoría, subcategoría, precio, solo disponibles), orden (destacados, precio, más nuevos), búsqueda `?q=` y paginación |
| `/tienda/[categoria]` | Categoría | Texto propio para SEO, chips de subcategorías, grilla con los mismos filtros |
| `/tienda/[categoria]/[sub]` | Subcategoría | Igual que categoría (p. ej. `/tienda/fragancias/premium-gata-golosa`) |
| `/coleccion/navidad` | Colección de temporada | Productos marcados como Navidad, con su propio encabezado |
| `/producto/[slug]` | Ficha de producto | Galería, precio, selector de presentación (precio y disponibilidad cambian con ella), "agotado", cantidad limitada a las unidades disponibles, **Agregar al carrito**, "Preguntar por WhatsApp", descripción, envíos en una línea, relacionados, migas de pan |
| `/carrito` | Carrito | Productos con su presentación, cantidades, subtotal, envío (tarifa fija nacional), total, botón al checkout. Al agregar un producto se abre además un **mini carrito lateral** |
| `/checkout` | Pago | Datos de contacto, dirección (departamento, ciudad, dirección, indicaciones), resumen, aceptación de términos y tratamiento de datos → Wompi |
| `/pedido/[codigo]` | Estado del pedido | Confirmación tras pagar y seguimiento: pago, despacho, transportadora y guía. Se abre con el link del correo (lleva un token) |
| `/nosotros` | Historia de la marca | Texto, fotos de proceso |
| `/contacto` | Contacto | WhatsApp, correo, Instagram, ciudad y horarios (sin formulario) |
| `/preguntas-frecuentes` | FAQ | Las mismas preguntas de la landing, ampliadas |
| `/envios-y-devoluciones` | Política de envíos | Tarifa fija nacional, tiempos de despacho, cambios y devoluciones |
| `/terminos` · `/privacidad` | Legales | Términos, retracto y reversión del pago (Ley 1480), tratamiento de datos (Ley 1581) |
| 404 | No encontrada | Con sticker y enlaces a la tienda |
| `sitemap.xml` · `robots.txt` | SEO | Generados con productos y categorías |

La búsqueda del header lleva a `/tienda?q=…`. El header y el footer **ya enlazan** a casi todas estas rutas; hoy dan 404 en el preview.

### 2.2 Panel (privado)

| Ruta | Qué tiene |
|---|---|
| `/admin/ingresar` | Login con correo y contraseña |
| `/admin` | Inicio: pedidos por despachar y accesos rápidos |
| `/admin/productos` | Listado con foto, nombre, precio y estado; buscador |
| `/admin/productos/nuevo` · `/admin/productos/[id]` | Formulario del producto con sus imágenes |
| `/admin/pedidos` | Pedidos pagados: pestañas **Por despachar** / **Despachados** / Todos |
| `/admin/pedidos/[codigo]` | Detalle del pedido y botón **Despachar** |

Interno: `/api/wompi/webhook` (eventos de pago). La subida de imágenes y los formularios del panel usan Server Actions.

---

## 3. Panel de administración (sencillo)

Lo mínimo para operar la tienda. Un solo usuario (la clienta).

### 3.1 Productos
- **Campos:** nombre (el slug se genera solo y no cambia después, para no romper links), categoría y subcategoría (de la lista fija), descripción (un salto de línea es un párrafo; las líneas con "- " son una lista), advertencia corta ("No compatible con parafina") y etiqueta ("Personalizable").
- **Personalización:** interruptor "Se puede personalizar" + la pregunta para el cliente ("Color y mensaje", "Color", "Aroma"). En la ficha aparece un campo de texto con esa pregunta.
- **Presentaciones:** cada producto tiene una o más (p. ej. fragancia de 30 ml y 60 ml; cera de 1 kg y 5 kg), cada una con nombre, precio, **precio anterior** opcional (el catálogo actual usa mucho "ANTES $10.000 / AHORA $8.000"; la tienda lo muestra tachado) e inventario propio. El precio por docena que hoy va en la descripción pasa a ser una presentación más ("Docena"). Si el producto tiene una sola, la ficha no muestra selector y el formulario la ve como un precio normal.
- **Inventario (las dos opciones a la vez),** por presentación:
  - **Unidades** (opcional): se descuentan solas con cada venta pagada y, al llegar a 0, la presentación se muestra agotada. En el listado aparece "pocas unidades" cuando quedan 3 o menos.
  - **Sin unidades** (campo vacío): no se lleva conteo; sirve para productos por encargo o personalizados.
  - **Interruptor Agotado:** manda siempre; apaga la venta aunque queden unidades.
- **Interruptores del producto:** visible en la tienda, destacado en el inicio, colección Navidad. El producto se ve agotado cuando todas sus presentaciones lo están.
- **Imágenes:** subir varias (arrastrando), reordenarlas (la primera es la principal) y escribir el texto alternativo, que es obligatorio. Al subir se optimizan solas (WebP, máximo 1600 px).
- **Eliminar = ocultar**, para no romper pedidos viejos que usan ese producto.

### 3.2 Pedidos y despacho
- **Listado** de pedidos pagados, con los que faltan por despachar primero.
- **Detalle:** cliente, teléfono, correo, dirección, productos, total y referencia de Wompi. Botones para copiar la dirección y escribir al cliente por WhatsApp.
- **Despachar:** formulario con **transportadora** (texto libre: puede ser cualquiera y se decide al despachar; se autocompletan las ya usadas), **número de guía**, **link de rastreo** opcional y nota opcional → confirmar. El pedido pasa a *Despachado*, se guarda la fecha y **se envía el correo de envío al cliente**. El panel muestra si el correo salió; si falló, hay un botón **Reenviar**. La guía se puede corregir y el correo se puede reenviar.

**No está en el panel:** categorías, la tarifa de envío, ajustes, usuarios ni reportes. Eso vive en el código o en variables de entorno y lo cambia el desarrollador.

---

## 4. Flujo de compra y despacho

1. **Carrito:** vive en el navegador (localStorage). Guarda productos y cantidades; los precios siempre se leen de la base de datos.
2. **Checkout:** valida los datos, **recalcula los precios en el servidor**, suma la **tarifa fija nacional** de envío, **verifica que haya unidades** en las presentaciones con inventario y crea el pedido en estado `pendiente_pago`, con un código legible (`LUS-000123`) y un token para el link de seguimiento.
3. **Pago:** se abre el widget de Wompi con la firma de integridad generada en el servidor.
4. **Webhook de Wompi:** si el pago es `APPROVED`, el pedido pasa a `pagado`, **se descuentan las unidades** (en una transacción) y salen los correos de venta (cliente y Lusarte). Si es `DECLINED`, `VOIDED` o `ERROR`, el pedido pasa a `rechazado` y sale el correo de pago no completado. Todo es idempotente: si Wompi repite el evento, no se duplican estados ni correos.
   - Si dos personas pagan la última unidad casi al tiempo, el inventario queda en negativo: el pedido se marca **"revisar inventario"** y el correo de venta nueva lo avisa, para que la clienta reponga o le escriba al cliente. Un pago aprobado nunca se rechaza por esto.
5. **Confirmación:** `/pedido/[codigo]` muestra el estado. Si el webhook aún no llegó, consulta la transacción directamente en la API de Wompi.
6. **Despacho:** la clienta despacha desde el panel; el pedido pasa a `despachado` y sale el correo con la guía.

```
pendiente_pago ──► pagado ──► despachado
       └─────────► rechazado
```

### 4.1 Wompi
- **Widget / Web Checkout** con **firma de integridad** (SHA-256 de referencia + monto en centavos + moneda + secreto de integridad), generada en el servidor.
- **Webhook de eventos** (`transaction.updated`) en `/api/wompi/webhook`, validando el checksum del evento con el secreto de eventos; procesamiento idempotente por referencia.
- Página de confirmación que consulta el estado de la transacción en la API de Wompi (respaldo si el webhook tarda).
- Estados: `PENDING` → `APPROVED` / `DECLINED` / `VOIDED` / `ERROR`. El pedido pasa a `pagado` solo con `APPROVED`.
- Pruebas completas en **sandbox** (tarjetas y PSE de prueba) antes de pasar a llaves de producción.

---

## 5. Correos (Resend)

| # | Correo | Para | Cuándo | Contenido |
|---|---|---|---|---|
| 1 | **Confirmación de compra** | Cliente | Pago aprobado | Código del pedido, productos, total, costo de envío, dirección, tiempo estimado de despacho, link a `/pedido/[codigo]`, WhatsApp |
| 2 | **Nueva venta** | Lusarte (`ADMIN_EMAIL`, admite varios) | Pago aprobado | Cliente con teléfono y correo, dirección, productos, total, referencia de Wompi, botón **Despachar** que abre el pedido en el panel |
| 3 | **Tu pedido va en camino** | Cliente | La clienta despacha | Transportadora, **número de guía**, link de rastreo (si se puso), dirección de entrega, productos, nota |
| 4 | **Pago no completado** | Cliente | Pago rechazado | Qué pasó, link para volver a intentarlo y WhatsApp |

- Plantillas con React Email y la marca (paleta, stickers, logo), con versión en texto plano.
- Cada envío queda registrado (`email_log`): evita duplicados, deja ver en el panel si salió y permite reenviar.
- Si el correo falla, el pago y el pedido no se afectan: queda marcado para reenviar.
- Como la transportadora puede ser cualquiera, el link de rastreo lo pega la clienta al despachar. Si no lo pone, el correo lleva la transportadora y el número de guía.
- Remitente `pedidos@lusarte.net`. Verificar `lusarte.net` en Resend agregando en la zona DNS de Hostinger: DKIM (`resend._domainkey`), y MX + SPF en el subdominio `send`. Esto **no choca** con los buzones de correo de Hostinger (el MX raíz sigue siendo de Hostinger), así que Lusarte puede recibir respuestas en su correo normal. Agregar también un registro DMARC.

---

## 6. Datos

| Tabla | Campos principales |
|---|---|
| `products` | slug, nombre, categoría, subcategoría, descripción, advertencia, etiqueta, personalización (pregunta o vacío), visible, destacado, navidad, orden, fechas |
| `product_options` | producto, nombre ("30 ml", "Docena"), precio, precio anterior, **unidades** (vacío = sin conteo), agotado, orden. Todo producto tiene al menos una |
| `product_images` | producto, archivo, alt, orden |
| `orders` | código, token, nombre, correo, teléfono, cédula (opcional), departamento, ciudad, dirección, indicaciones, subtotal, envío, total, estado, referencia y transacción de Wompi, `paid_at`, transportadora, número de guía, link de rastreo, nota de despacho, `shipped_at`, alerta "revisar inventario" |
| `order_items` | pedido, producto, presentación, **nombre y precio copiados al momento de la compra**, cantidad |
| `email_log` | pedido, tipo de correo, destinatario, estado, id de Resend, fecha |
| `admin_users` | correo, contraseña (scrypt), versión de sesión (cambiar la clave cierra las sesiones abiertas) |

Las categorías y subcategorías siguen en el código (`src/data/catalog.ts`), porque el panel no las edita; los slugs se mantienen. Los precios se guardan como enteros en COP.

---

## 7. Stack

| Capa | Tecnología | Por qué |
|---|---|---|
| Framework | **Next.js 16** (App Router, Server Components, Server Actions), `output: "standalone"` | Páginas estáticas/ISR para SEO; el mismo build corre en cualquier hosting Node |
| Estilos | **Tailwind CSS v4** con los tokens de marca de `globals.css` | Ya en uso en la landing |
| Base de datos | **MySQL** vía `DATABASE_URL` | Incluida en los hostings candidatos |
| ORM | **Drizzle ORM** + `mysql2` | Tipado, migraciones versionadas en el repo |
| Auth (solo panel) | Propia: cookie firmada (HMAC) + contraseña con scrypt + freno a la fuerza bruta | Un solo usuario: no justifica una librería ni tablas de sesiones. Se crea o cambia con `npm run admin:create` |
| Imágenes | `sharp` al subir + carpeta persistente configurable (`UPLOADS_DIR`); plan B Cloudinary | Depende de qué hosting persista archivos (ver 7.1) |
| Pagos | **Wompi** Widget + webhook | Pasarela local en COP |
| Correo | **Resend** (API HTTP, nunca SMTP) + React Email | Funciona igual en cualquier hosting |
| Validación | Zod en checkout y panel | Un solo esquema para cliente y servidor |

### 7.1 Hosting — requisitos y riesgos a verificar (si es Hostinger; lo equivalente aplica a los otros)

1. **El plan debe soportar Node.js.** Solo los planes **Business** y **Cloud** corren apps Next.js; los planes Single/Premium de hosting compartido no. Verificar en hPanel antes de comprar (sección "Web Apps" / "Node.js").
2. **Recursos limitados** (CPU/RAM fijos): el build se hace en el deploy; se prioriza páginas estáticas/ISR y se evita trabajo pesado en cada request.
3. **Persistencia de archivos subidos:** un redeploy puede reemplazar la carpeta de la app. Las imágenes del panel se guardan en una carpeta fuera del directorio de build. Se prueba en la Fase 3; si no es confiable, el plan B es Cloudinary (gratis en este volumen).
4. **Sin cron nativo en la app:** la reconciliación de pagos se hace con el webhook de Wompi + consulta del estado de la transacción en la página de confirmación. Si hace falta, se usa el Cron Job de hPanel llamando a una ruta protegida.
5. **Variables de entorno** (llaves Wompi, Resend, DB, secreto de auth) se configuran en hPanel, nunca en el repo.
6. **Backups:** activar los backups diarios del plan e incluir la base de datos.

---

## 8. SEO completo + Google Business Profile

- Metadata por página (title, description, canonical a `https://lusarte.net` sin `www`, 301 desde `www`), `lang="es-CO"`, Open Graph `es_CO`.
- **JSON-LD:** `Organization`, `Store`, `WebSite` + `SearchAction`, `Product` + `Offer` (precio, disponibilidad), `BreadcrumbList` y `FAQPage`.
- `sitemap.xml` dinámico y `robots.txt`; quitar el `noindex` actual solo en el lanzamiento.
- Imágenes OG por producto y categoría con `next/og`.
- Categorías y subcategorías con texto propio, para posicionar "insumos para hacer velas", "cera de soya", "fragancias para velas", etc.
- URLs limpias en español, migas de pan y enlaces internos entre categorías y productos relacionados.
- Alt obligatorio en el panel.
- Core Web Vitals: LCP < 2.5 s, CLS < 0.1, INP < 200 ms.
- **Google Search Console** (verificación + sitemap) y **Google Business Profile** con la ficha, el link a la tienda, fotos y horarios.

---

## 9. Plan de acción por fases

Cada fase se publica en el preview para que la clienta la revise antes de seguir.

### Fase 1 — Landing ✅
Diseño con la marca, hero "Enciéndela" (2026-10-07), secciones y responsive. Los destacados ya salen de la base de datos.

### Fase 2 — Decisiones y cuentas 🟡 *(en paralelo, la mayoría depende de la clienta)*
- **Hosting: GoDaddy** (decidido el 2026-10-07). ⚠️ Falta comprarlo y validar el checklist del Anexo A.
- Cuenta de Wompi con llaves de sandbox; acceso a la zona DNS de `lusarte.net`; cuenta de Resend.
- Respuestas a las decisiones pendientes (§10.2), sobre todo el valor de la tarifa de envío.
- **Catálogo real: ya existe en Canva** ([bit.ly/Lusartecatalogo](https://bit.ly/Lusartecatalogo)). Son 11 sub-catálogos, uno por categoría, con 265 páginas y unos 350 productos. El texto ya está extraído en `docs/catalogo-canva/`. Falta pedirle a la clienta:
  - **las fotos originales**: las del Canva son buenas, pero solo se pueden sacar en baja resolución desde el link público. Lo ideal es que exporte las fotos o comparta el diseño con permiso de edición;
  - **las unidades disponibles** de los productos que quiera controlar.

**Listo cuando:** hay hosting con MySQL funcionando y las decisiones de §10.2 están respondidas.

### Fase 3 — Base técnica 🟡
- ✅ Drizzle + MySQL 8.4: esquema de §6 (productos, presentaciones, fotos, usuario del panel) y migración inicial en `drizzle/`. Los pedidos se agregan en la fase 6.
- ✅ **Catálogo de Canva transcrito** a `data/catalogo/*.json`: 326 productos y 583 presentaciones, con precios, precio anterior, docenas y agotados. Las páginas dudosas se verificaron contra las capturas, incluidos los 🚫 de agotado de Gata Golosa. `npm run db:seed` lo carga sin pisar lo que se edite en el panel.
- ✅ Fotos: se reducen a WebP de máximo 1600 px y se guardan en `UPLOADS_DIR`; se sirven por `/media/<archivo>` con caché larga.
- ✅ Variables en `.env.example`; guía de desarrollo local en `docs/DESARROLLO.md` (MySQL portable, sin instalador).
- ✅ Build de producción (`output: "standalone"`) sin errores.
- ⚠️ **Falta:** deploy de prueba en GoDaddy con su MySQL: migrar, cargar el catálogo, crear el usuario de la clienta y confirmar que `UPLOADS_DIR` (dentro de `/public/assets/`) sobrevive a un redeploy.

**Listo cuando:** la landing lee los destacados de la base de datos en el hosting real.

### Fase 4 — Panel: productos e imágenes ✅ (en local)
- Login con freno a la fuerza bruta (5 intentos cada 15 min); todas las páginas y acciones verifican la sesión.
- Inicio con conteos que llevan a la lista filtrada (ocultos, agotados, pocas unidades, sin foto).
- Lista con buscador, filtro por categoría y por estado.
- Formulario: datos, presentaciones (precio, precio anterior, unidades, agotado, orden), fotos (subida inmediata, reducidas en el celular antes de enviarlas, orden, texto alternativo), visible/destacado/Navidad/personalizable, eliminar con confirmación. Avisa si hay cambios sin guardar.
- Al guardar, la tienda se actualiza al instante (caché invalidada).
- ⚠️ **Falta:** probarlo la clienta en su celular, una vez esté en GoDaddy.

**Listo cuando:** la clienta crea un producto con fotos desde el celular y aparece en la tienda. Desde aquí **la clienta puede ir cargando el catálogo real** mientras se construye el resto.

### Fase 5 — Tienda pública ✅ (en local)
- `/tienda`, categorías, subcategorías, colección Navidad: búsqueda (sin tildes), filtro de precio, solo disponibles, orden y paginación de 24. Los filtros viven en la URL, así que se pueden compartir.
- Ficha: galería, selector de presentación con precio anterior tachado, "¡Quedan N!" cuando quedan 3 o menos, cantidad limitada por el inventario, campo de personalización y relacionados.
- SEO ya incluido: metadata y canonical por página, JSON-LD de `Product`, `BreadcrumbList` y `FAQPage`.
- Páginas: nosotros, contacto, preguntas frecuentes, envíos y devoluciones, términos, privacidad y 404. Las que llevan texto provisional lo dicen en la página.
- ⚠️ **Temporal hasta la fase 6:** el botón de compra de la ficha es "Pedir por WhatsApp" (con producto, presentación, cantidad y personalización en el mensaje), y `/carrito` invita a pedir por WhatsApp.

**Listo cuando:** ningún enlace del sitio da 404 y se puede navegar todo el catálogo en celular.

### Fase 6 — Carrito, checkout y pagos
- Mini carrito y `/carrito` con la tarifa fija nacional; cantidades limitadas por el inventario.
- `/checkout` con validación; creación del pedido con precios recalculados en el servidor.
- Wompi: firma de integridad, webhook verificado e idempotente, descuento de unidades al aprobarse el pago, `/pedido/[codigo]` con respaldo por API.
- Pruebas completas en sandbox: tarjeta aprobada, rechazada y PSE.

**Listo cuando:** una compra de prueba deja el pedido en `pagado` aunque el cliente cierre la pestaña antes de volver.

### Fase 7 — Correos de venta
- Plantillas 1, 2 y 4 con la marca; registro en `email_log`.
- DNS de Resend (DKIM, SPF, DMARC) verificado en `lusarte.net`.

**Listo cuando:** cada compra de prueba genera exactamente un correo al cliente y uno a Lusarte, y no llegan a spam en Gmail ni Outlook.

### Fase 8 — Pedidos y despacho
- `/admin/pedidos` y detalle del pedido.
- Formulario **Despachar** (transportadora libre + guía + link de rastreo opcional + nota) → estado `despachado` → correo 3, con reenvío y corrección de guía.
- Seguimiento visible en `/pedido/[codigo]`.

**Listo cuando:** la clienta despacha un pedido de prueba desde el celular y el cliente recibe la transportadora, la guía y el link de rastreo.

### Fase 9 — SEO completo y Google Business Profile
- Todo lo de §8.
- *Opcional (Premium):* GA4 con eventos de e-commerce, Merchant Center y Clarity.

### Fase 10 — QA y lanzamiento
- Textos legales finales, revisados por la clienta.
- Llaves de producción de Wompi y una compra real de bajo monto, con reembolso.
- Pruebas en iPhone y Android; Lighthouse ≥ 95 en Performance, SEO y Accesibilidad.
- `lusarte.net` apuntando al hosting, SSL, `www` → raíz, quitar `noindex`, backups activos.
- **Guía corta para la clienta:** cómo subir un producto y cómo despachar un pedido.

---

## 10. Decisiones

### 10.1 Tomadas (2026-10-07)

| Tema | Decisión |
|---|---|
| Envío | ~~Tarifa fija nacional~~ → (2026-10-19) domicilio por ciudad en las ciudades locales, recoger, y nacional con flete al cobro (Panel → Envíos) |
| Presentaciones | **Sí.** Cada producto tiene una o más, cada una con su precio |
| Inventario | **Las dos opciones:** unidades opcionales por presentación (se descuentan solas) + interruptor de agotado manual |
| Transportadora | **Cualquiera**, escrita al momento del despacho; el link de rastreo es opcional |
| Hosting | **GoDaddy** Web Hosting Económico (se compra el 2026-10-08) |
| Personalización | **Sí**, en los productos marcados: el cliente escribe lo que quiere (color, mensaje, aroma) y llega con el pedido |

### 10.2 Pendientes

| # | Pregunta | Afecta | Propuesta si no hay respuesta |
|---|---|---|---|
| 1 | **¿Cuánto es la tarifa fija de envío?** ¿Hay envío gratis desde algún monto o recogida local? | Checkout, correo 1, política de envíos | Solo la tarifa fija, sin envío gratis |
| 2 | **¿Qué correos reciben el aviso de venta?** | Correo 2 | El correo de la clienta |
| 3 | **¿Pide cédula o NIT al comprar?** | Checkout | Opcional |
| 4 | **¿Necesita factura electrónica DIAN?** | Fuera de alcance; si aplica, se hace por fuera de la tienda | Confirmar con su contador |
| 5 | **Correo de la clienta para el panel** | Crear su usuario | Se configura después (pedido por el usuario) |

---

## Anexo A. Hosting: candidatos y portabilidad

Decidido: **Node.js**. Candidatos:
- **Hostinger Business Web Hosting** (recomendado): Node.js con hasta 5 web apps, MySQL, correo, backups diarios. Single/Premium **no** sirven.
- **GoDaddy Web Hosting Económico** (COP 7.499/mes el 1er año → COP 36.999/mes al renovar): incluye **1 app Node.js publicada** con MySQL gestionado + 2 apps de preview (privadas, se borran a los 30 días). GA desde 2026-08-12 (el FAQ aún dice beta). Compatible con el stack: salida HTTPS para Wompi/Resend, sin SMTP (usamos la API de Resend), archivos persistentes solo en `/public/assets/`. Límites de CPU/RAM sin publicar. **Validar en los 30 días de reembolso** (checklist abajo).
  - Checklist de validación: build de Next.js en su plataforma · conexión a su MySQL · llamada HTTPS saliente a Wompi sandbox y a Resend · subir un archivo a `/public/assets/`, redeploy y confirmar que sigue ahí y se sirve · tiempo de respuesta desde Colombia · dominio `lusarte.net` + HTTPS · confirmar si el correo y el SSL "1 año" son gratis solo el primer año.
  - Staging: con una sola app publicada, la app de producción hace de staging (`noindex` + clave simple) hasta el lanzamiento.
- **Namecheap VPS Pulsar**: más barato a largo plazo, pero autogestionado.

**Regla de portabilidad:** el código debe correr igual en cualquiera de los tres: Next.js `standalone`, escuchar en `process.env.PORT` sobre `0.0.0.0`, MySQL vía `DATABASE_URL`, emails por la API HTTP de Resend (nunca SMTP), uploads en una ruta configurable por variable de entorno, dependencias de runtime en `dependencies`.

---

## Anexo B. Audit de assets

### B.1 Inventario

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

### B.2 Paleta de marca (extraída del `.ai`)

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

### B.3 Tipografía

No hay fuentes en los archivos (logo y tagline están en curvas). El tagline es una sans geométrica itálica en mayúsculas con tracking amplio. Propuesta a validar en Fase 1:
- **Títulos:** sans con carácter y ligeramente redondeada (candidatas: Bricolage Grotesque, Outfit).
- **Texto:** sans legible (candidatas: DM Sans, Inter).
- **Detalle de marca:** itálica mayúscula con tracking amplio, imitando el tagline, para eyebrows y etiquetas.
- El logo y el lettering del póster se usan siempre como SVG, nunca como fuente.

### B.4 Lo que falta (bloquea fases posteriores, no la Fase 1)

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
