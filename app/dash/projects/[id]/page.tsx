import { db } from "@/db"
import { eq, and } from "drizzle-orm"
import { projects } from "@/db/schema"
import { notFound } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { headers } from "next/headers"
import { Inter, Instrument_Serif } from "next/font/google"
import DeleteProject from "@/components/delete-project"
import Redeploy from "@/components/redeploy-project"
import EnvTextArea from "@/components/project/env-textarea"
import Domains from "@/components/project/domains"
import Deployments from "@/components/project/deployments"
import Link  from "next/link"
import { LayoutDashboard, Rocket, Globe, KeyRound, Settings } from "lucide-react"

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
        building: 'bg-amber-500',
    }

    const latest = [...project.deployments].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
    const liveHost = `${project.subdomain}.app.sakshamjain.dev`

    const fields = [
        {
            label: 'Repository',
            value: (
                <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-neutral-900">
                    {project.githubUrl.replace('https://github.com/', '')} ↗
                </a>
            ),
        },
        {
            label: 'Domain',
            value: (
                <a href={`https://${liveHost}`} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-neutral-900">
                    {liveHost} ↗
                </a>
            ),
        },
        {
            label: 'Commit',
            value: <span className="font-mono">{project.commit?.substring(0, 7) ?? '-'}</span>,
        },
        {
            label: 'Last deployed',
            value: latest
                ? new Date(latest.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                : '-',
        },
        ...(admin ? [{ label: 'Port', value: <span className="font-mono">{project.port}</span> }] : []),
    ]
    const items = [
    { label: "Overview", path: "", icon: LayoutDashboard },
    { label: "Deployments", path: "/deployments", icon: Rocket },
    { label: "Domains", path: "/domains", icon: Globe },
    { label: "Environment", path: "/env", icon: KeyRound },
    { label: "Settings", path: "/settings", icon: Settings },
]
    return (
        <div className={`mx-auto flex w-full max-w-6xl px-1 py-5 ${inter.className}`}>
            <nav
            aria-label="Project"
            className="flex gap-1 overflow-x-auto border-b border-neutral-200/80 pb-2 md:sticky md:top-5 md:w-56 md:shrink-0 md:flex-col md:self-start md:overflow-visible md:border-b-0 md:pb-0"
        >
            {items.map(({ label, path, icon: Icon }) => {
                const href = '/projects/'+`${project.id}` + path
                const active = path === "/env"

                return (
                    <Link
                        key={label}
                        href={href}
                        aria-current={active ? "page" : undefined}
                        className={`flex shrink-0 items-center gap-2.5 rounded-sm px-3 py-2 text-sm transition-colors ${
                            active
                                ? "bg-neutral-900 font-medium text-white"
                                : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                        }`}
                    >
                        <Icon className="h-4 w-4" />
                        {label}
                    </Link>
                )
            })}
        </nav>
<div className="ml-6 w-full">
            <div className="mb-6 rounded-sm border border-neutral-200/80 bg-white">
                <div className="flex flex-wrap items-center gap-3 px-4 py-4">
                    <h1 className={`text-4xl tracking-tight text-neutral-900 ${instrumentSerif.className}`}>{project.name}</h1>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${statusStyle[project.status] ?? 'bg-neutral-50 text-neutral-600 ring-neutral-500/20'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${dotStyle[project.status] ?? 'bg-neutral-400'}`} />
                        {project.status}
                    </span>
                </div>

                <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-neutral-100 px-4 py-3.5 sm:grid-cols-3 lg:grid-cols-5">
                    {fields.map((f) => (
                        <div key={f.label} className="min-w-0">
                            <dt className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">{f.label}</dt>
                            <dd className="mt-1 truncate text-xs text-neutral-700">{f.value}</dd>
                        </div>
                    ))}
                </dl>
            </div>

            <Deployments project={project} />



            <Domains />



            <label className="text-xs text-neutral-400 font-semibold">Environment Variables</label>



            <EnvTextArea />
            <div className="mt-6 gap-2 flex">
                <DeleteProject projectId={project.id} />
                <Redeploy projectId={project.id} />
            </div>
</div>
        </div>
    )
}

export const metadata = {
    title: 'Project Details',
    description: 'Details of the project',
}