CREATE TABLE `droneImages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`farmId` int NOT NULL,
	`fieldId` int,
	`uploadedBy` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileSize` int NOT NULL,
	`fileType` varchar(50) NOT NULL,
	`storagePath` varchar(500) NOT NULL,
	`storageUrl` varchar(500),
	`captureDate` timestamp,
	`altitude` int,
	`resolution` int,
	`gpsLatitude` varchar(50),
	`gpsLongitude` varchar(50),
	`status` enum('uploaded','processing','completed','failed') NOT NULL DEFAULT 'uploaded',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `droneImages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fieldBoundaries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fieldId` int NOT NULL,
	`imageId` int,
	`boundary` text NOT NULL,
	`area` varchar(20) NOT NULL,
	`perimeter` varchar(20),
	`source` enum('manual','auto_detected','gps') NOT NULL DEFAULT 'auto_detected',
	`accuracy` varchar(10),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fieldBoundaries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ndviAnalysis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`imageId` int NOT NULL,
	`farmId` int NOT NULL,
	`fieldId` int,
	`avgNdvi` varchar(10),
	`minNdvi` varchar(10),
	`maxNdvi` varchar(10),
	`healthScore` int,
	`mapImagePath` varchar(500),
	`geoJsonPath` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ndviAnalysis_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ndviZones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`analysisId` int NOT NULL,
	`zoneType` enum('very_poor','poor','moderate','good','excellent') NOT NULL,
	`area` varchar(20),
	`percentage` varchar(10),
	`geoJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ndviZones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pestDetections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`imageId` int NOT NULL,
	`farmId` int NOT NULL,
	`fieldId` int,
	`pestType` varchar(100),
	`severity` enum('low','moderate','high','critical') NOT NULL,
	`affectedArea` varchar(20),
	`confidence` varchar(10),
	`location` text,
	`imageUrl` varchar(500),
	`recommendations` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pestDetections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `processingJobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`imageId` int NOT NULL,
	`jobType` enum('ndvi','segmentation','object_detection','area_measurement','pest_detection','water_stress') NOT NULL,
	`status` enum('queued','processing','completed','failed') NOT NULL DEFAULT 'queued',
	`progress` int DEFAULT 0,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `processingJobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `waterStressAnalysis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`imageId` int NOT NULL,
	`farmId` int NOT NULL,
	`fieldId` int,
	`avgNdwi` varchar(10),
	`stressLevel` enum('none','low','moderate','high','severe') NOT NULL,
	`affectedArea` varchar(20),
	`mapImagePath` varchar(500),
	`geoJsonPath` varchar(500),
	`recommendations` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `waterStressAnalysis_id` PRIMARY KEY(`id`)
);
