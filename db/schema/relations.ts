import { relations } from "drizzle-orm"
import { account, session, user } from "./auth"
import { projects } from "./projects"
import { deployments } from "./deployments"
import { logs } from "./logs"

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}))

export const projectsRelations = relations(projects, ({ many }) => ({
  logs: many(logs),
  deployments: many(deployments),
}))

export const deploymentsRelations = relations(deployments, ({ one, many }) => ({
  project: one(projects, {
    fields: [deployments.projectId],
    references: [projects.id],
  }),
  logs: many(logs),
}))