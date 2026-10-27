import { pgTable, text, timestamp, integer, index } from "drizzle-orm/pg-core"
import { randomUUID } from "node:crypto"
import { projects } from "./projects"

export const deployments = pgTable(
  "deployments",
  {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    dockerDeploymentId: text("docker_deployment_id"),
    status: text("status").notNull().default("queued"),
    port: integer("port")
      .notNull()
      .generatedAlwaysAsIdentity({ startWith: 4000, maxValue: 65000 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    type: text("type").notNull().default("deployment"),
    startedAt: timestamp("started_at"),
    finishedAt: timestamp("finished_at"),
  },
  (table) => [
    index("deployments_project_id_idx").on(table.projectId),
    index("deployments_created_at_idx").on(table.createdAt),
  ],
)