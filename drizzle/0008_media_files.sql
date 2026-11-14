CREATE TABLE `media_files` (
	`file` varchar(100) NOT NULL,
	`data` mediumblob NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `media_files_file` PRIMARY KEY(`file`)
);
