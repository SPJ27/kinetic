import { eq, asc } from "drizzle-orm"
import { db } from "@/db"
import { logs } from "@/db/schema/logs"

export function projectLogsQuery(projectId: string) {
  return db
    .select()
    .from(logs)
    .where(eq(logs.projectId, projectId))
    .orderBy(asc(logs.createdAt))
}