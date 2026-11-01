import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { randomUUID } from "node:crypto";
import { user } from "./auth";

export const projects = pgTable("projects", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  name: text("name").notNull(),
  userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }).default('vF16kpXdly62GDvKTZ0DOrN1qsR2kPEU'),

  githubUrl: text("github_url").notNull(),
  dockerDeploymentId: text("docker_deployment_id"),
  port: integer("port").notNull().default(4000),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});