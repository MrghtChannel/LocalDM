ALTER TABLE "characters" ADD COLUMN "surname" varchar(32) DEFAULT 'Персонаж' NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "fraction" integer DEFAULT 0 NOT NULL;