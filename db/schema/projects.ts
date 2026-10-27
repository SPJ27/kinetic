import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { randomUUID } from "node:crypto";

export const projects = pgTable("projects", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  name: text("name").notNull(),
  githubUrl: text("github_url").notNull(),
  dockerDeploymentId: text("docker_deployment_id"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});