CREATE TABLE `settings` (
	`key` varchar(40) NOT NULL,
	`value` text NOT NULL,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `settings_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `shipping_zone` varchar(10) DEFAULT 'nacional' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `payment_type` varchar(15) DEFAULT 'wompi' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `scheduled_for` varchar(10);--> statement-breakpoint
ALTER TABLE `orders` ADD `delivery_window` varchar(80);--> statement-breakpoint
ALTER TABLE `orders` ADD `delivered_at` timestamp;--> statement-breakpoint
ALTER TABLE `orders` ADD `cancelled_at` timestamp;