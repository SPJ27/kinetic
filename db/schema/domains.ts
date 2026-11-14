import { pgTable, text, timestamp, index, boolean } from "drizzle-orm/pg-core"
import { randomUUID } from "node:crypto"
import { projects } from "./projects"

export const domains = pgTable(
  "domains",
  {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    verified: boolean("verified").notNull().default(false),

    createdAt: timestamp("created_at").defaultNow().notNull(),
domain: text("domain").array().notNull().default([]),  
    
  },
  (table) => [
    index("domains_project_id_idx").on(table.projectId),
    index("domains_created_at_idx").on(table.createdAt),
  ],
)