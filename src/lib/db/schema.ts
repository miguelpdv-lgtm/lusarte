import { boolean, index, int, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

// Precios en pesos colombianos, enteros (sin decimales).
// Las categorías viven en el código (src/data/catalog.ts); aquí se guarda su slug.

export const products = mysqlTable(
  "products",
  {
    id: int().autoincrement().primaryKey(),
    slug: varchar({ length: 160 }).notNull().unique(),
    name: varchar({ length: 160 }).notNull(),
    category: varchar({ length: 60 }).notNull(),
    subcategory: varchar({ length: 60 }),
    description: text().notNull(),
    /** Advertencia corta visible en la ficha: "No compatible con parafina" */
    warning: varchar({ length: 160 }),
    /** Etiqueta sobre la foto: "Personalizable", "Premium"… */
    badge: varchar({ length: 40 }),
    /** Si no es null, el producto se puede personalizar y esta es la pregunta: "Color y mensaje" */
    personalization: varchar({ length: 80 }),
    visible: boolean().notNull().default(true),
    featured: boolean().notNull().default(false),
    navidad: boolean().notNull().default(false),
    /** Orden dentro de su categoría (menor primero) */
    position: int().notNull().default(0),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().onUpdateNow(),
  },
  (t) => [index("products_category_idx").on(t.category, t.subcategory)],
);

/** Presentaciones: todo producto tiene al menos una ("30 ml", "Docena", "Única"). */
export const productOptions = mysqlTable(
  "product_options",
  {
    id: int().autoincrement().primaryKey(),
    productId: int()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    name: varchar({ length: 80 }).notNull(),
    price: int().notNull(),
    /** Precio anterior, se muestra tachado ("ANTES $10.000") */
    compareAtPrice: int(),
    /** null = sin conteo de inventario */
    stock: int(),
    soldOut: boolean().notNull().default(false),
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
