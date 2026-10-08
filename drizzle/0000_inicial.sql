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
	`name` varchar(80) NOT NULL,
	`price` int NOT NULL,
	`compare_at_price` int,
	`stock` int,
	`sold_out` boolean NOT NULL DEFAULT false,
	`position` int NOT NULL DEFAULT 0,
	CONSTRAINT `product_options_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(160) NOT NULL,
	`name` varchar(160) NOT NULL,
	`category` varchar(60) NOT NULL,
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
ALTER TABLE `product_images` ADD CONSTRAINT `product_images_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_options` ADD CONSTRAINT `product_options_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `product_images_product_idx` ON `product_images` (`product_id`);--> statement-breakpoint
CREATE INDEX `product_options_product_idx` ON `product_options` (`product_id`);--> statement-breakpoint
CREATE INDEX `products_category_idx` ON `products` (`category`,`subcategory`);