import { db } from "@/db"
import { logs } from "@/db/schema/logs"
import { eq, asc, sql, and } from "drizzle-orm"
import { realtime } from "@/db/realtime"
import ProjectLogs from "@/components/ballmac/project-logs"
import { deployments, projects } from "@/db/schema"
import { notFound } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { headers } from "next/headers"
import { Inter, Instrument_Serif } from "next/font/google"
import Image from "next/image"
import { duration } from "@/lib/time-taken"

const inter = Inter({ subsets: ["latin"] })
const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: "400" })

/*
Sensitive fields *admin only
 - port
 - dockerDeploymentId
*/



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
    const project = await db.query.projects.findFirst({ where: and(eq(projects.id, id), eq(projects.userId, session.user.id)), with: { deployments: true, user: true } })

    if (!project) return notFound()

    const admin = session.user.role === 'admin'
    const statusStyle: Record<string, string> = {
        active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
        failed: 'bg-red-50 text-red-700 ring-red-600/20',
        pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    }
    const dotStyle: Record<string, string> = {
        active: 'bg-emerald-500',
        failed: 'bg-red-500',
        pending: 'bg-amber-500',
    }

    return (
        <div className={`mx-auto w-full max-w-5xl px-6 py-10 ${inter.className}`}>
            <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs tracking-wide text-neutral-400 transition-colors hover:text-neutral-700"
            >
                {project.githubUrl.replace('https://github.com/', '')} ↗
            </a>

            <div className={`mt flex flex-wrap items-center gap-3 ${instrumentSerif.className}`}>
                <h1 className="text-4xl font-semibold tracking-tight text-neutral-900">{project.name}</h1>
            </div>


            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
                {project.commit && (
                    <span className="inline-flex items-center gap-1.5 rounded-sm bg-neutral-50 px-1.5 py-0.5 font-mono text-neutral-600">
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotStyle[project.status] ?? 'bg-neutral-400'}`} />
                        {project.commit.substring(0, 7)}
                    </span>
                )}
                {project.deployments[0]?.createdAt && (
                    <span>Deployed {new Date(project.deployments[0].createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                )}
                {admin && <span>Port {project.port}</span>}
            </div>

            <div className="mt-8 divide-y divide-neutral-100 rounded-sm border border-neutral-200/80 bg-white">
                <p className="px-4 py-3 text-sm font-medium text-neutral-900">Deployments</p>
                {project.deployments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).map((d) => (
                    <div key={d.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                        <span className="truncate font-mono text-xs text-neutral-500">{d.commit}</span>
                        <span className="truncate font-mono text-xs text-neutral-500">{d.createdAt.toDateString()}, {d.createdAt.toLocaleTimeString()}</span>
                        <span className="truncate font-mono text-xs text-neutral-500">{duration(d.createdAt, d.finishedAt)}</span>
                        <span className="flex shrink-0 items-center gap-1.5 text-xs capitalize text-neutral-600">
                            <span className={`h-1.5 w-1.5 rounded-full ${dotStyle[d.status] ?? 'bg-neutral-400'}`} />
                            {d.status}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

export const metadata = {
    title: 'Project Details',
    description: 'Details of the project',
}