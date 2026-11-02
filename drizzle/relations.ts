import { relations } from "drizzle-orm/relations";
import { projects, logs, user, session, account, deployments } from "./schema";

export const logsRelations = relations(logs, ({one}) => ({
	project: one(projects, {
		fields: [logs.projectId],
		references: [projects.id]
	}),
}));

export const projectsRelations = relations(projects, ({one, many}) => ({
	logs: many(logs),
	deployments: many(deployments),
	user: one(user, {
		fields: [projects.userId],
		references: [user.id]
	}),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	sessions: many(session),
	accounts: many(account),
	projects: many(projects),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const deploymentsRelations = relations(deployments, ({one}) => ({
	project: one(projects, {
		fields: [deployments.projectId],
		references: [projects.id]
	}),
}));