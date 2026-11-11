CREATE TABLE "characters" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "characters_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
  "player_id" integer NOT NULL,
  "name" varchar(32) NOT NULL,
  "age" integer DEFAULT 18 NOT NULL,
  "position" jsonb,
  "level" integer DEFAULT 1 NOT NULL,
  "experience" integer DEFAULT 0 NOT NULL,
  "cash" integer DEFAULT 0 NOT NULL,
  "bank" integer DEFAULT 0 NOT NULL,
  "faction" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  CONSTRAINT "characters_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
ALTER TABLE "player_appearance" ADD COLUMN "character_id" integer;
--> statement-breakpoint
INSERT INTO "characters" ("player_id", "name", "age", "position", "created_at", "updated_at")
SELECT p."id", 'Персонаж ' || p."id", 18, p."position", COALESCE(a."created_at", now()), now()
FROM "players" p JOIN "player_appearance" a ON a."player_id" = p."id";
--> statement-breakpoint
UPDATE "player_appearance" a SET "character_id" = c."id"
FROM "characters" c WHERE c."player_id" = a."player_id";
--> statement-breakpoint
ALTER TABLE "player_appearance" ALTER COLUMN "character_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "player_appearance" ADD CONSTRAINT "player_appearance_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "player_appearance" ADD CONSTRAINT "player_appearance_character_id_unique" UNIQUE("character_id");
--> statement-breakpoint
ALTER TABLE "player_appearance" DROP CONSTRAINT "player_appearance_player_id_unique";
--> statement-breakpoint
ALTER TABLE "player_appearance" DROP CONSTRAINT "player_appearance_player_id_players_id_fk";
--> statement-breakpoint
ALTER TABLE "player_appearance" DROP COLUMN "player_id";
