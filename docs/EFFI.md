# Integración con Effi ERP

Effi es la fuente de verdad de **artículos, precios, stock y ventas**. La tienda y el panel son una capa encima.

## Cómo funciona

| Qué | Dónde vive | Desde el panel |
|---|---|---|
| Artículos: nombre, referencia, categoría, precio normal y especial, stock mínimo, descripción detallada | Effi → copia en `effi_articles` | Se editan y se guardan **en Effi** (`PUT articulo`) |
| Crear producto o presentación | Effi | "Nuevo producto" / "Agregar presentación" crean el artículo **en Effi** (`POST articulo`), con stock inicial opcional |
| Stock | Effi | "Ajustar stock" crea un **ajuste de inventario** en Effi (`POST ajuste_inventario`; sumar exige costo unitario, por defecto el costo promedio) |
| Anular | Effi | "Anular en Effi" (`DELETE articulo`, reversible desde Effi) y lo retira de la tienda |
| Fotos, nombre web, advertencia, etiqueta, personalización, visible, destacado, Navidad, precio anterior, agrupación | Solo la web (`products`, `product_options`, `product_images`) | Se editan en el panel |
| Ventas (remisiones) | Effi → copia resumida en `effi_sales` | Estadísticas del inicio |

Lo que se crea o cambia directamente en Effi llega a la web con la sincronización.

- **Agrupación:** en Effi cada presentación es un artículo ("FRAGANCIA CHINOLA 30 ML"). La sincronización quita el sufijo de presentación (`src/lib/effi/grouping.ts`) y agrupa por nombre base y categoría: 736 artículos quedan en 518 productos. Si la agrupación se equivoca, el panel permite mover o separar presentaciones (la clave `separado|<id>` evita que la sincronización las vuelva a unir).
- **Categorías:** `effiCategoryMap` en `src/data/catalog.ts` traduce cada categoría de Effi a una de la tienda. Si Effi crea una categoría nueva, sus productos quedan ocultos y marcados "Sin categoría" en el panel hasta agregarla al mapa.
- **Disponibilidad:** los artículos sin control de stock (`gestion_stock` 0 o 1) se venden sin límite; los demás, según el stock de Effi.
- **Sincronización:** `src/lib/effi/sync.ts`.
  - Automática: cuando alguien abre una página de la tienda y la última sincronización tiene más de 15 minutos, corre después de responder (`src/lib/effi/auto.ts`).
  - Manual: botón "Sincronizar ahora" en el inicio del panel, o `npm run effi:sync`.
  - Artículos: los 736 se leen completos (8 peticiones). Ventas: desde la última remisión guardada, con 3 días de margen (la primera vez, 13 meses).
- **API:** `src/lib/effi/client.ts`. Bearer token (`EFFI_API_KEY`), 120 peticiones por minuto (reintenta con `Retry-After`), paginación de 100. La documentación completa de la API la extrajo el cliente de `https://effi.com.co/app/api` (no se sube al repo).

## Configuración de Effi (cuenta de Lusarte)

| Dato | Valor |
|---|---|
| Sucursal / bodega / centro de costos / caja | 1 / 1 "Bodega Lusarte" / 1 "Whatsapp" / 1 "LUSARTE" |
| Tarifas | 1 Tarifa normal (web), 2 Tarifa especial (se conserva al cambiar precios) |
| Forma de pago contado | 1 "Contado" |
| Artículo de envío | "DOMICILIO" (servicio) |
| Impuestos | Ningún artículo tiene impuestos |
| Integración ecommerce | 1 "Lusarte" (Ecommerce genérico) |

## Pendiente (fase 6, con el checkout y Wompi)

- **Remisión de venta automática:** al aprobarse un pago, `POST api/remision_v` con `idempotency_key` = código del pedido (sin duplicados en reintentos), cliente (buscar o crear en `api/cliente`), artículos + DOMICILIO, forma de pago Contado y medio de pago electrónico (falta definir a qué cuenta bancaria de Effi entra el dinero de Wompi). Effi descuenta el inventario.
- **PDF al admin:** la API de Effi **no entrega el PDF** de la remisión. Se generará un PDF propio con el número de remisión de Effi, cliente, productos y totales, y se enviará por correo (Resend) con el enlace a la remisión en Effi.
- **Permisos que necesita el usuario de la API key:** Artículos (consultar, crear, modificar, anular), Artículos - Stock disponible, Ajustes de inventario (crear), Remisiones de venta (consultar, crear), Clientes (consultar, crear), Tablas maestras (consultar).
- No hay ambiente de pruebas en Effi: las pruebas de remisión crean documentos reales que luego hay que anular (`DELETE api/remision_v`).
