CREATE TABLE `admin_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(160) NOT NULL,
	`password_hash` varchar(200) NOT NULL,
	`session_version` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `effi_articles` (
	`id` int NOT NULL,
	`nombre` varchar(160) NOT NULL,
	`referencia` varchar(60),
	`categoria_id` int,
	`categoria_nombre` varchar(120),
	`precio` int NOT NULL,
	`precio_especial` int NOT NULL DEFAULT 0,
	`gestion_stock` int NOT NULL,
	`stock` int NOT NULL DEFAULT 0,
	`stock_minimo` int NOT NULL DEFAULT 0,
	`tipo_articulo` int NOT NULL,
	`vigente` boolean NOT NULL DEFAULT true,
	`synced_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `effi_articles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `effi_sales` (
	`sucursal` int NOT NULL,
	`id` int NOT NULL,
	`id_transaccion` varchar(40) NOT NULL,
	`fecha` datetime NOT NULL,
	`total` int NOT NULL,
	`cliente` varchar(160),
	`ciudad` varchar(80),
	`ecommerce` boolean NOT NULL DEFAULT false,
	`vigente` boolean NOT NULL DEFAULT true,
	CONSTRAINT `effi_sales_sucursal_id_pk` PRIMARY KEY(`sucursal`,`id`)
);
--> statement-breakpoint
CREATE TABLE `product_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`product_id` int NOT NULL,
	`file` varchar(200) NOT NULL,
	`alt` varchar(200) NOT NULL,
	`width` int NOT NULL,
	`height` int NOT NULL,
	`position` int NOT NULL DEFAULT 0,
	CONSTRAINT `product_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_options` (
	`id` int AUTO_INCREMENT NOT NULL,
	`product_id` int NOT NULL,
	`effi_article_id` int NOT NULL,
	`label` varchar(80) NOT NULL,
	`compare_at_price` int,
	`hidden` boolean NOT NULL DEFAULT false,
	`position` int NOT NULL DEFAULT 0,
	CONSTRAINT `product_options_id` PRIMARY KEY(`id`),
	CONSTRAINT `product_options_effiArticleId_unique` UNIQUE(`effi_article_id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(160) NOT NULL,
	`group_key` varchar(200) NOT NULL,
	`name` varchar(160) NOT NULL,
	`category` varchar(60),
	`subcategory` varchar(60),
	`description` text NOT NULL,
	`warning` varchar(160),
	`badge` varchar(40),
	`personalization` varchar(80),
	`visible` boolean NOT NULL DEFAULT true,
	`featured` boolean NOT NULL DEFAULT false,
	`navidad` boolean NOT NULL DEFAULT false,
	`position` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `sync_state` (
	`key` varchar(40) NOT NULL,
	`value` text NOT NULL,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sync_state_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
ALTER TABLE `product_images` ADD CONSTRAINT `product_images_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_options` ADD CONSTRAINT `product_options_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `effi_articles_categoria_idx` ON `effi_articles` (`categoria_id`);--> statement-breakpoint
CREATE INDEX `effi_sales_fecha_idx` ON `effi_sales` (`fecha`);--> statement-breakpoint
CREATE INDEX `product_images_product_idx` ON `product_images` (`product_id`);--> statement-breakpoint
CREATE INDEX `product_options_product_idx` ON `product_options` (`product_id`);--> statement-breakpoint
CREATE INDEX `products_group_idx` ON `products` (`group_key`);--> statement-breakpoint
CREATE INDEX `products_category_idx` ON `products` (`category`,`subcategory`);