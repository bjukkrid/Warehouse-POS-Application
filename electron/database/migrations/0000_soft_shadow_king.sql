CREATE TABLE `employees` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`role` text DEFAULT 'Cashier' NOT NULL,
	`passcode` text NOT NULL,
	`phone` text,
	`email` text,
	`discount_limit` real DEFAULT 0,
	`status` text DEFAULT 'Active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`category` text DEFAULT 'Uncategorized' NOT NULL,
	`brand` text,
	`description` text,
	`base_price` real DEFAULT 0 NOT NULL,
	`cost` real DEFAULT 0 NOT NULL,
	`sku` text,
	`barcode` text,
	`stock` integer DEFAULT 0 NOT NULL,
	`low_stock_alert` integer DEFAULT 10 NOT NULL,
	`status` text DEFAULT 'Published' NOT NULL,
	`images` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_sku_unique` ON `products` (`sku`);--> statement-breakpoint
CREATE TABLE `sale_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sale_id` integer,
	`product_id` integer,
	`quantity` integer NOT NULL,
	`price_at_time` real NOT NULL,
	FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sales` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`total_amount` real NOT NULL,
	`discount_amount` real DEFAULT 0,
	`employee_id` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
