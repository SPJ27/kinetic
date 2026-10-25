import { db } from '@/db'
import { logs } from '@/db/schema/logs'
import { eq } from 'drizzle-orm'
import React from 'react'

const page = async ({params}: { params: Promise<{ id: string }> }) => {
    const {id} = await params
    const projectLogs = await db.select().from(logs).where(eq(logs.projectId, id))


  return (
    <div>
        {projectLogs.map((log) => (
            <div key={log.id}>
                <p>{log.createdAt.toISOString()}: {log.output}</p>
            </div>
        ))}
    </div>
  )
}

export default page