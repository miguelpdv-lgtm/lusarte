CREATE TABLE `email_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_id` int NOT NULL,
	`kind` varchar(20) NOT NULL,
	`recipient` varchar(500) NOT NULL,
	`status` varchar(20) NOT NULL,
	`provider_id` varchar(200),
	`error` varchar(500),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `carrier` varchar(80);--> statement-breakpoint
ALTER TABLE `orders` ADD `tracking_number` varchar(80);--> statement-breakpoint
ALTER TABLE `orders` ADD `tracking_url` varchar(500);--> statement-breakpoint
ALTER TABLE `orders` ADD `shipping_note` varchar(500);--> statement-breakpoint
ALTER TABLE `orders` ADD `shipped_at` timestamp;--> statement-breakpoint
ALTER TABLE `email_log` ADD CONSTRAINT `email_log_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `email_log_order_idx` ON `email_log` (`order_id`,`kind`);