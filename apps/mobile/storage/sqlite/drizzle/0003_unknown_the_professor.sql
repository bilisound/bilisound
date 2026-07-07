CREATE TABLE `theme_profile` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`palette_json` text NOT NULL,
	`yuru_chara_json` text,
	`image_asset_id` text
);
