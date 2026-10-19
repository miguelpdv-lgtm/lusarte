CREATE TABLE `order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_id` int NOT NULL,
	`product_id` int,
	`option_id` int,
	`effi_article_id` int NOT NULL,
	`product_name` varchar(160) NOT NULL,
	`option_name` varchar(80) NOT NULL,
	`unit_price` int NOT NULL,
	`quantity` int NOT NULL,
	`note` varchar(300),
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(20),
	`token` varchar(64) NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'pendiente_pago',
	`name` varchar(120) NOT NULL,
	`email` varchar(160) NOT NULL,
	`phone` varchar(30) NOT NULL,
	`legal_id` varchar(30),
	`department` varchar(60) NOT NULL,
	`city` varchar(80) NOT NULL,
	`address` varchar(200) NOT NULL,
	`address_notes` varchar(200),
	`subtotal` int NOT NULL,
	`shipping` int NOT NULL,
	`total` int NOT NULL,
	`wompi_transaction_id` varchar(60),
	`wompi_status` varchar(20),
	`payment_method` varchar(30),
	`paid_at` timestamp,
	`stock_alert` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `order_items_order_idx` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE INDEX `orders_status_idx` ON `orders` (`status`,`created_at`);