'use client'
import React from 'react'
import deleteProject from './delete-project'
import { redeployProject } from '@/actions/projects'

const Redeploy = ({ projectId }: { projectId: string }) => {
  return (
    <div>
      <button onClick={async () => { await redeployProject(projectId) }} className='bg-neutral-800/90 text-white px-3 py-0.5 tracking-wider text-xs rounded-md hover:bg-neutral-900'>Redeploy</button>

    </div>
  )
}

export default Redeploy