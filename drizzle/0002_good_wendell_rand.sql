CREATE TABLE `batchShares` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`shareToken` varchar(64) NOT NULL,
	`title` varchar(255),
	`description` text,
	`productBarcodes` json NOT NULL,
	`isPublic` boolean NOT NULL DEFAULT true,
	`viewCount` int NOT NULL DEFAULT 0,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `batchShares_id` PRIMARY KEY(`id`),
	CONSTRAINT `batchShares_shareToken_unique` UNIQUE(`shareToken`)
);
