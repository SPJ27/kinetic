'use client'
import { deleteProject } from '@/actions/projects'
import React from 'react'

const DeleteProject = ({projectId}: {projectId: string}) => {
  return (
    <div>
        <button onClick={async () => {await deleteProject(projectId)}} className='bg-red-500 text-white px-3 py-0.5 tracking-wider text-xs rounded-md hover:bg-red-600'>Delete</button>
    </div>
  )
}

export default DeleteProject