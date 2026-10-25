import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as auth from "./schema/auth";
import * as projects from "./schema/projects";
import * as logs from "./schema/logs";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3,
  connectionTimeoutMillis: 10_000,
  idleTimeoutMillis: 30_000,
  keepAlive: true,
});

pool.on("error", (err) => {
  console.error("DB pool error:", err.message);
});

export const workerDb = drizzle(pool, {
  schema: { ...auth, ...projects, ...logs },
});