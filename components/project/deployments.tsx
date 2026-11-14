import { duration } from "@/lib/time-taken"

const Deployments = ({ project }: { project:  Project}) => {
    const dotStyle: Record<string, string> = {
        active: 'bg-emerald-500',
        failed: 'bg-red-500',
        building: 'bg-amber-500',
    }
    return (
        <div>
            <div className="mt-8 divide-y mb-6 divide-neutral-100 rounded-sm border border-neutral-200/80 bg-white">
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

export default Deployments