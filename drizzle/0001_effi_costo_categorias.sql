CREATE TABLE `effi_categories` (
	`id` int NOT NULL,
	`nombre` varchar(120) NOT NULL,
	`vigente` boolean NOT NULL DEFAULT true,
	CONSTRAINT `effi_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `effi_articles` ADD `costo` int DEFAULT 0 NOT NULL;