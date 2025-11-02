CREATE TABLE `detected_diseases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`detectionId` int NOT NULL,
	`diseaseName` varchar(100) NOT NULL,
	`confidence` varchar(10) NOT NULL,
	`severity` enum('low','moderate','high','critical') NOT NULL,
	`bboxX` int,
	`bboxY` int,
	`bboxWidth` int,
	`bboxHeight` int,
	`affectedArea` varchar(20),
	`recommendations` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `detected_diseases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `disease_database` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`scientificName` varchar(200),
	`cropType` varchar(50) NOT NULL,
	`symptoms` text,
	`causes` text,
	`treatment` text,
	`prevention` text,
	`imageUrl` varchar(500),
	`severity` enum('low','moderate','high','critical') NOT NULL DEFAULT 'moderate',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `disease_database_id` PRIMARY KEY(`id`),
	CONSTRAINT `disease_database_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `disease_detections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`fieldId` int,
	`imageUrl` varchar(500) NOT NULL,
	`cropType` varchar(50) NOT NULL,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `disease_detections_id` PRIMARY KEY(`id`)
);
