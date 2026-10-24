import { pgTable, text, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { randomUUID } from "node:crypto";

export const logs = pgTable("logs", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  output: text("output"),
  type: text("type"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});