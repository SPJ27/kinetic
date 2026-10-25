import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as auth from "./schema/auth";
import * as projects from "./schema/projects";
import * as logs from "./schema/logs";

const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle({
  client: sql,
  schema: { ...auth, ...projects, ...logs },
});