CREATE TABLE IF NOT EXISTS `expenses` (
	`id` text(21) PRIMARY KEY NOT NULL,
	`description` text NOT NULL,
	`created_at` integer DEFAULT (datetime('now')) NOT NULL,
	`paid_on` integer,
	`paid_by_user_id` text(21) NOT NULL,
	`amount` integer NOT NULL,
	`reimbursed_at` integer,
	`split_id` text(21) NOT NULL,
	`group_id` text(21) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `groups` (
	`id` text(21) PRIMARY KEY NOT NULL,
	`name` text(255) NOT NULL,
	`created_at` integer DEFAULT (datetime('now')) NOT NULL,
	`owner_id` text(21) NOT NULL,
	`pattern` text,
	`color` text(7)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `invites` (
	`id` text(21) PRIMARY KEY NOT NULL,
	`group_id` text(21) NOT NULL,
	`created_at` integer DEFAULT (datetime('now')) NOT NULL,
	`accepted_at` integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `split_portion_def` (
	`split_id` text(21) NOT NULL,
	`parts` integer NOT NULL,
	`user_id` text(21) NOT NULL,
	`total_parts` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `splits` (
	`id` text(21) PRIMARY KEY NOT NULL,
	`name` text(255) NOT NULL,
	`group_id` text(21) NOT NULL,
	`color` text(7)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `users` (
	`id` text(21) PRIMARY KEY NOT NULL,
	`name` text(255) NOT NULL,
	`created_at` integer DEFAULT (datetime('now')),
	`email` text(255),
	`profile_url` text(512)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `users_to_group` (
	`user_id` text(21) NOT NULL,
	`group_id` text(21) NOT NULL,
	PRIMARY KEY(`group_id`, `user_id`)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `expense_group_idx` ON `expenses` (`group_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `split_group_idx` ON `splits` (`group_id`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `split_name_un` ON `splits` (`name`,`group_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `utg_group_idx` ON `users_to_group` (`group_id`);
