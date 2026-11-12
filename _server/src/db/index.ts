import { drizzle } from "drizzle-orm/mysql2";
import dotenv from "dotenv";
import path from "path";
import mysql from "mysql2/promise";

import * as schema from "./schema";

dotenv.config({ path: path.resolve(__dirname, "../../_server/.env") });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("[ERROR] Database connection failed: DATABASE_URL is missing. Set it in _server/.env.");
  throw new Error("DATABASE_URL is missing. Set it in _server/.env.");
}

const pool = mysql.createPool(databaseUrl);

export const $db = drizzle(pool, { schema, mode: "default" });

export async function checkDatabaseConnection() {
  try {
    await pool.query("SELECT 1");
    console.log("[DONE] Database connection established.");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[ERROR] Database connection failed: ${message}`);
  }
}
