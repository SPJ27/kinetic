import { db } from "@/db"
import { logs } from "@/db/schema/logs"
import { eq, asc, sql } from "drizzle-orm"
import { realtime } from "@/db/realtime"
import ProjectLogs from "@/components/ballmac/project-logs"

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const query = db
    .select({
      id: sql<string>`${logs.id}`.as("id"),
      output: sql<string | null>`${logs.output}`.as("output"),
      type: sql<string | null>`${logs.type}`.as("type"),
      projectId: sql<string>`${logs.projectId}`.as("projectId"),
      createdAt: sql<Date>`${logs.createdAt}`.as("createdAt"),
      logType: sql<string>`${logs.logType}`.as("logType"),
    })
    .from(logs)
    .where(eq(logs.projectId, id))
    .orderBy(asc(logs.createdAt))

  const sealedQuery = await realtime.seal({ query })

  return <ProjectLogs sealedQuery={sealedQuery} />
}