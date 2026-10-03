CREATE TABLE `suggestions` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`version` text NOT NULL,
	`location` text NOT NULL,
	`proposal` text NOT NULL,
	`reason` text NOT NULL,
	`author` text NOT NULL,
	`status` text DEFAULT 'proposed' NOT NULL,
	`request_id` text NOT NULL,
	`fingerprint` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `suggestions_request_id_unique` ON `suggestions` (`request_id`);--> statement-breakpoint
CREATE INDEX `suggestions_created` ON `suggestions` (`created_at`);--> statement-breakpoint
CREATE INDEX `suggestions_fingerprint_created` ON `suggestions` (`fingerprint`,`created_at`);