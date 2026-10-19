import { boolean, datetime, index, int, mysqlTable, primaryKey, text, timestamp, varchar } from "drizzle-orm/mysql-core";

// Effi ERP es la fuente de verdad de artículos, precios, stock y ventas.
// effi_* es una copia local que se sincroniza (src/lib/effi/sync.ts); products/product_options/product_images
// son la capa de la tienda: cómo se agrupan, muestran y describen esos artículos en la web.
// Precios en pesos colombianos, enteros.

/** Copia de los artículos de Effi (api/articulo). */
export const effiArticles = mysqlTable(
  "effi_articles",
  {
    /** Id del artículo en Effi */
    id: int().primaryKey(),
    nombre: varchar({ length: 160 }).notNull(),
    referencia: varchar({ length: 60 }),
    categoriaId: int(),
    categoriaNombre: varchar({ length: 120 }),
    /** Tarifa normal (la de la web) */
    precio: int().notNull(),
    /** Tarifa especial: se guarda para no borrarla al modificar precios en Effi */
    precioEspecial: int().notNull().default(0),
    /** 0 sin trazabilidad, 1 sin control de stock, 2-5 con control */
    gestionStock: int().notNull(),
    stock: int().notNull().default(0),
    stockMinimo: int().notNull().default(0),
    /** Costo promedio (para los ajustes de inventario que suman stock) */
    costo: int().notNull().default(0),
    /** 4 = servicio (p. ej. DOMICILIO), no se muestra en la tienda */
    tipoArticulo: int().notNull(),
    vigente: boolean().notNull().default(true),
    syncedAt: timestamp().notNull().defaultNow(),
  },
  (t) => [index("effi_articles_categoria_idx").on(t.categoriaId)],
);

/** Categorías de artículos de Effi (api/categoria_articulo), para elegirlas desde el panel. */
export const effiCategories = mysqlTable("effi_categories", {
  id: int().primaryKey(),
  nombre: varchar({ length: 120 }).notNull(),
  vigente: boolean().notNull().default(true),
});

/** Copia resumida de las remisiones de venta de Effi (api/remision_v), para las estadísticas. */
export const effiSales = mysqlTable(
  "effi_sales",
  {
    sucursal: int().notNull(),
    id: int().notNull(),
    idTransaccion: varchar({ length: 40 }).notNull(),
    /** Fecha de creación en UTC */
    fecha: datetime().notNull(),
    total: int().notNull(),
    cliente: varchar({ length: 160 }),
    ciudad: varchar({ length: 80 }),
    /** Viene de una integración ecommerce (la tienda) */
    ecommerce: boolean().notNull().default(false),
    vigente: boolean().notNull().default(true),
  },
  (t) => [primaryKey({ columns: [t.sucursal, t.id] }), index("effi_sales_fecha_idx").on(t.fecha)],
);

/** Estado de las sincronizaciones (última corrida, errores). */
export const syncState = mysqlTable("sync_state", {
  key: varchar({ length: 40 }).primaryKey(),
  value: text().notNull(),
  updatedAt: timestamp().notNull().defaultNow().onUpdateNow(),
});

/** Producto de la tienda: agrupa uno o más artículos de Effi (sus presentaciones). */
export const products = mysqlTable(
  "products",
  {
    id: int().autoincrement().primaryKey(),
    slug: varchar({ length: 160 }).notNull().unique(),
    /** Clave de agrupación automática: "<categoría Effi>|<nombre sin presentación>" */
    groupKey: varchar({ length: 200 }).notNull(),
    name: varchar({ length: 160 }).notNull(),
    /** Derivadas de la categoría de Effi en cada sincronización (effiCategoryMap) */
    category: varchar({ length: 60 }),
    subcategory: varchar({ length: 60 }),
    description: text().notNull(),
    warning: varchar({ length: 160 }),
    badge: varchar({ length: 40 }),
    personalization: varchar({ length: 80 }),
    visible: boolean().notNull().default(true),
    featured: boolean().notNull().default(false),
    navidad: boolean().notNull().default(false),
    position: int().notNull().default(0),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().onUpdateNow(),
  },
  (t) => [index("products_group_idx").on(t.groupKey), index("products_category_idx").on(t.category, t.subcategory)],
);

/** Presentación: un artículo de Effi dentro de un producto de la tienda. */
export const productOptions = mysqlTable(
  "product_options",
  {
    id: int().autoincrement().primaryKey(),
    productId: int()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    effiArticleId: int().notNull().unique(),
    /** Nombre de la presentación en la web ("30 ml") */
    label: varchar({ length: 80 }).notNull(),
    /** Precio anterior (tachado). Solo existe en la web */
    compareAtPrice: int(),
    /** Ocultar esta presentación en la web sin tocar Effi */
    hidden: boolean().notNull().default(false),
    position: int().notNull().default(0),
  },
  (t) => [index("product_options_product_idx").on(t.productId)],
);

export const productImages = mysqlTable(
  "product_images",
  {
    id: int().autoincrement().primaryKey(),
    productId: int()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    /** Nombre del archivo dentro de UPLOADS_DIR */
    file: varchar({ length: 200 }).notNull(),
    alt: varchar({ length: 200 }).notNull(),
    width: int().notNull(),
    height: int().notNull(),
    position: int().notNull().default(0),
  },
  (t) => [index("product_images_product_idx").on(t.productId)],
);

export const adminUsers = mysqlTable("admin_users", {
  id: int().autoincrement().primaryKey(),
  email: varchar({ length: 160 }).notNull().unique(),
  passwordHash: varchar({ length: 200 }).notNull(),
  /** Al cambiar la contraseña sube y cierra las sesiones abiertas */
  sessionVersion: int().notNull().default(1),
  createdAt: timestamp().notNull().defaultNow(),
});

/**
 * Pedido de la tienda. El código (LUS-000123) es también la referencia del pago en Wompi.
 * pendiente_pago → pagado → despachado, o pendiente_pago → rechazado (se puede reintentar y pasar a pagado).
 */
export const orders = mysqlTable(
  "orders",
  {
    id: int().autoincrement().primaryKey(),
    code: varchar({ length: 20 }).unique(),
    /** Secreto del link de seguimiento (/pedido/<código>?t=<token>) */
    token: varchar({ length: 64 }).notNull(),
    status: varchar({ length: 20 }).notNull().default("pendiente_pago"),
    name: varchar({ length: 120 }).notNull(),
    email: varchar({ length: 160 }).notNull(),
    phone: varchar({ length: 30 }).notNull(),
    legalId: varchar({ length: 30 }),
    /** Tipo de documento en Effi (t_dni): 1 NIT, 2 CC, 3 pasaporte, 4 CE */
    legalIdType: int(),
    department: varchar({ length: 60 }).notNull(),
    city: varchar({ length: 80 }).notNull(),
    /** Ids de Effi del departamento y el municipio (dirección del cliente en la remisión) */
    effiProvinceId: int(),
    effiCityId: int(),
    address: varchar({ length: 200 }).notNull(),
    addressNotes: varchar({ length: 200 }),
    subtotal: int().notNull(),
    shipping: int().notNull(),
    total: int().notNull(),
    wompiTransactionId: varchar({ length: 60 }),
    wompiStatus: varchar({ length: 20 }),
    paymentMethod: varchar({ length: 30 }),
    paidAt: timestamp(),
    /** Se vendió más de lo que había en stock (dos pagos casi al tiempo): revisar con la clienta */
    stockAlert: boolean().notNull().default(false),
    /** Despacho: transportadora libre, guía, link de rastreo opcional y nota para el cliente */
    carrier: varchar({ length: 80 }),
    trackingNumber: varchar({ length: 80 }),
    trackingUrl: varchar({ length: 500 }),
    shippingNote: varchar({ length: 500 }),
    shippedAt: timestamp(),
    /** Remisión de venta creada en Effi al aprobarse el pago (sucursal 1) */
    effiClient: int(),
    effiRemisionId: int(),
    /** Último error al crear la remisión (null si salió bien o no se ha intentado) */
    effiRemisionError: varchar({ length: 500 }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().onUpdateNow(),
  },
  (t) => [index("orders_status_idx").on(t.status, t.createdAt)],
);

/** Línea del pedido: nombre y precio copiados al momento de la compra. */
export const orderItems = mysqlTable(
  "order_items",
  {
    id: int().autoincrement().primaryKey(),
    orderId: int()
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: int(),
    optionId: int(),
    effiArticleId: int().notNull(),
    productName: varchar({ length: 160 }).notNull(),
    optionName: varchar({ length: 80 }).notNull(),
    unitPrice: int().notNull(),
    quantity: int().notNull(),
    /** Respuesta a la pregunta de personalización */
    note: varchar({ length: 300 }),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

/** Correos enviados por pedido: evita duplicados, muestra en el panel si salió y permite reenviar. */
export const emailLog = mysqlTable(
  "email_log",
  {
    id: int().autoincrement().primaryKey(),
    orderId: int()
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    /** confirmacion | venta | despacho | pago_fallido */
    kind: varchar({ length: 20 }).notNull(),
    recipient: varchar({ length: 500 }).notNull(),
    /** enviado | fallido | sin_configurar */
    status: varchar({ length: 20 }).notNull(),
    /** messageId de Brevo */
    providerId: varchar({ length: 200 }),
    error: varchar({ length: 500 }),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (t) => [index("email_log_order_idx").on(t.orderId, t.kind)],
);
