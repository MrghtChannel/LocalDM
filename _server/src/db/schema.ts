import { relations, sql } from "drizzle-orm";
import { bigint, int, json, mysqlEnum, mysqlTable, real, timestamp, varchar, text } from "drizzle-orm/mysql-core";

export const playersTable = mysqlTable("players", {
  id: int().primaryKey().autoincrement(),
  email: varchar({ length: 255 }).notNull().unique(),
  passwordHash: varchar({ length: 255 }).notNull(),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const charactersTable = mysqlTable("characters", {
  id: int().primaryKey().autoincrement(),
  playerId: int("player_id").notNull().references(() => playersTable.id, { onDelete: "cascade" }),
  name: varchar({ length: 32 }).notNull(),
  surname: varchar({ length: 32 }).notNull().default("Персонаж"),
  age: int().notNull().default(18),
  position: json("position").$type<{ x: number; y: number; z: number; heading: number }>(),
  level: int().notNull().default(1),
  experience: int().notNull().default(0),
  cash: int().notNull().default(0),
  bank: int().notNull().default(0),
  faction: text(),
  fraction: int("fraction").notNull().default(0),
  money: bigint("money", { mode: "number" }).notNull().default(1000),
  inventory: json("inventory").$type<string[]>().notNull().default(sql`('["weapon_revolver"]')`),
  fastSlots: json("fastSlots").$type<{ id: number | null; slot: number }[]>().notNull().default(sql`('[{"id":null,"slot":0},{"id":null,"slot":1},{"id":null,"slot":2}]')`),
  clothes: json("clothes"),
  buyclothes: json("buyclothes").$type<unknown[]>().notNull().default(sql`('[]')`),
  cars: json("cars").$type<unknown[]>().notNull().default(sql`('[{"model":"neon","name":"neon","price":1}]')`),
  kills: int("kills").notNull().default(0),
  deaths: int("deaths").notNull().default(0),
  lastFractionChange: bigint("last_fraction_change", { mode: "number" }),
  features: json("features"),
  secondarySlots: json("secondarySlots").$type<{ id: number | null; slot: number }[]>().notNull().default(sql`('[{"id":null,"slot":0},{"id":null,"slot":1}]')`),
  chip: int("chip").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const playersRelations = relations(playersTable, ({ many }) => ({ characters: many(charactersTable) }));
export const charactersRelations = relations(charactersTable, ({ one }) => ({
  player: one(playersTable, { fields: [charactersTable.playerId], references: [playersTable.id] }),
  appearance: one(playerApperanceTable),
}));

export const playerApperanceTable = mysqlTable("player_appearance", {
  id: int().primaryKey().autoincrement(),
  characterId: int("character_id")
    .notNull()
    .references(() => charactersTable.id, { onDelete: "cascade" })
    .unique(),

  // Head blend
  sex: mysqlEnum("sex", ["male", "female"]).notNull(),
  mother: int("mother").notNull(),
  father: int("father").notNull(),
  similarity: real("similarity").notNull(),
  skinTone: real("skin_tone").notNull(),

  // Head overlay
  blemishes: int("blemishes").notNull(),
  eyebrows: int("eyebrows").notNull(),
  ageing: int("ageing").notNull(),
  makeup: int("makeup").notNull(),
  complexion: int("complexion").notNull(),
  sunDamage: int("sun_damage").notNull(),
  lipstick: int("lipstick").notNull(),
  molesFreckles: int("moles_freckles").notNull(),

  // Face features
  noseWidth: real("nose_width").notNull(),
  noseHeight: real("nose_height").notNull(),
  noseLength: real("nose_length").notNull(),
  noseBridge: real("nose_bridge").notNull(),
  noseTip: real("nose_tip").notNull(),
  noseBridgeShift: real("nose_bridge_shift").notNull(),
  browHeight: real("brow_height").notNull(),
  browWidth: real("brow_width").notNull(),
  cheekboneHeight: real("cheekbone_height").notNull(),
  cheekboneWidth: real("cheekbone_width").notNull(),
  cheeksWidth: real("cheeks_width").notNull(),
  eyes: real("eyes").notNull(),
  lips: real("lips").notNull(),
  jawWidth: real("jaw_width").notNull(),
  jawHeight: real("jaw_height").notNull(),
  chinLength: real("chin_length").notNull(),
  chinPosition: real("chin_position").notNull(),
  chinWidth: real("chin_width").notNull(),
  chinShape: real("chin_shape").notNull(),
  neckWidth: real("neck_width").notNull(),

  // Colors
  hairStyle: int("hair_style").notNull(),
  facialHair: int("facial_hair").notNull(),
  eyeColor: int("eye_color").notNull(),
  hairColor: int("hair_color").notNull(),
  beardColor: int("beard_color").notNull(),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const playerAppearanceRelations = relations(playerApperanceTable, ({ one }) => ({
  character: one(charactersTable, {
    references: [charactersTable.id],
    fields: [playerApperanceTable.characterId],
  }),
}));
