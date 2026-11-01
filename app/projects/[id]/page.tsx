import { db } from "@/db"
import { logs } from "@/db/schema/logs"
import { eq, asc, sql, and } from "drizzle-orm"
import { realtime } from "@/db/realtime"
import ProjectLogs from "@/components/ballmac/project-logs"
import { deployments, projects } from "@/db/schema"
import { notFound } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { headers } from "next/headers"

export default async function Page({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const headersList = await headers()
    const session = await auth.api.getSession({ headers: headersList })
    if (!session) return notFound()
    //   const query = db
    //     .select({
    //       id: sql<string>`${logs.id}`.as("id"),
    //       output: sql<string | null>`${logs.output}`.as("output"),
    //       type: sql<string | null>`${logs.type}`.as("type"),
    //       projectId: sql<string>`${logs.projectId}`.as("projectId"),
    //       createdAt: sql<Date>`${logs.createdAt}`.as("createdAt"),
    //       logType: sql<string>`${logs.logType}`.as("logType"),
    //     })
    //     .from(logs)
    //     .where(eq(logs.projectId, id))
    //     .orderBy(asc(logs.createdAt))

    //   const sealedQuery = await realtime.seal({ query })
    //     console.log("sealedQuery", sealedQuery)
    //   return <ProjectLogs sealedQuery={sealedQuery} />
    const project = await db.query.projects.findFirst({ where: and(eq(projects.id, id), eq(projects.userId, session.user.id)), with: { deployments: true } })

    if (!project) return notFound()

    return <>
        <div>
            Deployments
            {project?.deployments.map(deployment => (<div key={deployment.id}>
                <h1>{deployment.id} - {deployment.status} - {new Date(deployment.createdAt).toLocaleString()}</h1>
                
            </div>))}
        </div>
    </>
}