ALTER TABLE `kids` RENAME TO `accounts`;--> statement-breakpoint
CREATE TABLE `changes` (
	`version` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`hash` text NOT NULL,
	`account` text,
	`op` text NOT NULL,
	`table` text NOT NULL,
	`key` text,
	`payload` text,
	`client` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	FOREIGN KEY (`account`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`client`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `changes_hash_unique` ON `changes` (`hash`);--> statement-breakpoint
CREATE TABLE `clients` (
	`id` text PRIMARY KEY NOT NULL,
	`last_mutation` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rules` (
	`id` text PRIMARY KEY NOT NULL,
	`description` text,
	`account` text NOT NULL,
	`amount` text NOT NULL,
	`recurrence` text NOT NULL,
	`begin_at` text NOT NULL,
	`end_at` text,
	`created_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	`deleted_at` integer DEFAULT 0,
	FOREIGN KEY (`account`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `txs` (
	`id` text PRIMARY KEY NOT NULL,
	`account` text NOT NULL,
	`description` text,
	`amount` integer NOT NULL,
	`date` text NOT NULL,
	`rule` text,
	`created_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	`deleted_at` integer DEFAULT 0,
	FOREIGN KEY (`account`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`rule`) REFERENCES `rules`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
ALTER TABLE `accounts` ADD `password` text;--> statement-breakpoint
ALTER TABLE `accounts` ADD `created_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL;--> statement-breakpoint
ALTER TABLE `accounts` ADD `updated_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL;--> statement-breakpoint
ALTER TABLE `accounts` ADD `deleted_at` integer DEFAULT 0;