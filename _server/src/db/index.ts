import { drizzle } from "drizzle-orm/node-postgres";
import dotenv from "dotenv";
import path from "path";
import { Pool } from "pg";

import * as schema from "./schema";

dotenv.config({ path: path.resolve(__dirname, "../../_server/.env") });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("[ERROR] Database connection failed: DATABASE_URL is missing. Set it in _server/.env.");
  throw new Error("DATABASE_URL is missing. Set it in _server/.env.");
}

const pool = new Pool({ connectionString: databaseUrl, connectionTimeoutMillis: 5000 });

export const $db = drizzle(pool, { schema });

export async function checkDatabaseConnection() {
  try {
    await pool.query("SELECT 1");
    console.log("[DONE] Database connection established.");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[ERROR] Database connection failed: ${message}`);
  }
}
