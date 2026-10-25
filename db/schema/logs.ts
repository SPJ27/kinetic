import { pgTable, text, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { randomUUID } from "node:crypto";
import { projects } from "./projects";

export const logs = pgTable("logs", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  output: text("output"),
  type: text("type"),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  logType: text("log_type").notNull(),
});