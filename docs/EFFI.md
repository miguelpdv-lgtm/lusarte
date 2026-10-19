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

## Remisiones de la tienda (`src/lib/effi/sales.ts`)

Cada pedido pagado crea su **remisión de venta** en Effi, igual a las que la clienta registra a mano:

1. **Cliente:** se busca por número de documento (el checkout lo pide con su tipo: CC, CE, NIT o pasaporte); si no existe, se crea con correo, celular y dirección.
2. **Remisión** (`POST remision_v`): sucursal, bodega y caja 1; centro de costos 1 "Whatsapp"; los artículos del pedido (cada presentación es un artículo de Effi) más **DOMICILIO** (artículo 492) con el valor del envío; forma de pago Contado; medio **Transferencia bancaria** (5) a la cuenta **Nequi** (1), que es a donde Wompi transfiere. Dirección con los ids de Effi del departamento y el municipio (el checkout los elige de `src/data/colombia-effi.json`, generado con `scripts/effi-colombia.ts`). Observación: `Pedido web LUS-000123 · Wompi <transacción>`; la personalización va en la observación de cada concepto.
3. **Idempotente:** la `idempotency_key` es el código del pedido; si Wompi repite el aviso o se reintenta, Effi responde 409 con la remisión ya creada y no se duplica.
4. **Al despachar** desde el panel, la transportadora y la guía se agregan a la observación de la remisión (`PUT remision_v`).
5. Los correos de confirmación y de venta nueva llevan el número de remisión y un **comprobante en PDF** propio (`src/lib/email/receipt.ts`): la API de Effi **no entrega** el PDF ni un enlace de la remisión. El panel también lo descarga ("Comprobante en PDF").

**Cuándo se crean:** solo con Wompi en **producción** (llave `pub_prod_…`). Con llaves de prueba no se crean, para que una compra de prueba no registre una venta real; el pedido muestra "Sin remisión" y el motivo. `EFFI_REMISIONES=siempre` las fuerza y `EFFI_REMISIONES=nunca` las apaga.

**Si falla** (por ejemplo, sin existencias en Effi o la API key vencida): el pago no se afecta, el error queda en el pedido, el aviso de venta lo dice y el panel muestra **Crear remisión en Effi** para reintentar (o se crea a mano).

**Pruebas:** Effi no tiene ambiente de pruebas. Las del 2026-10-19 dejaron las remisiones **931 y 932 anuladas** (autorizadas por el usuario), con el cliente CONSUMIDOR FINAL para no crear clientes.

- **Permisos que necesita el usuario de la API key:** Artículos (consultar, crear, modificar, anular), Artículos - Stock disponible, Ajustes de inventario (crear), Notas de remisión de venta (consultar, crear, modificar, anular), Clientes (consultar, crear), Tablas maestras (consultar).
- La documentación completa de la API está en `Effi_API_documentacion.md` (raíz del proyecto, fuera del repo por `.gitignore`).
