import React from 'react'

const Domains = () => {
  return (
    <div>
        <div className="mt-8 divide-y mb-6 divide-neutral-100 rounded-xs border border-neutral-200/60 bg-white">
                <p className="px-4 py-3 text-sm font-medium text-neutral-900">Domains</p>
                {/* {project.deployments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).map((d) => ( */}
                    <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                        <span className="truncate font-mono text-xs text-neutral-500">api.app.sakshamjain.dev</span>
                        
                    </div>
                {/* ))} */}
            </div>
    </div>
  )
}

export default Domains