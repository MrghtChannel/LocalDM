ALTER TABLE "characters" ADD COLUMN "money" bigint DEFAULT 1000 NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "inventory" jsonb DEFAULT '["weapon_revolver"]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "fastSlots" jsonb DEFAULT '[{"id":null,"slot":0},{"id":null,"slot":1},{"id":null,"slot":2}]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "clothes" jsonb;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "buyclothes" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "cars" jsonb DEFAULT '[{"model":"neon","name":"neon","price":1}]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "kills" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "deaths" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "last_fraction_change" bigint;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "features" jsonb;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "secondarySlots" jsonb DEFAULT '[{"id":null,"slot":0},{"id":null,"slot":1}]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "chip" integer DEFAULT 0 NOT NULL;