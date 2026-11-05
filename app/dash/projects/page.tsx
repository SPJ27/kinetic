import { getStats } from '@/lib/stats'
import React from 'react'

const page = async () => {
    const res = await getStats('ef4659d4-f6e5-478b-9056-d6e53d6d6509')
    return (
    <div>
        <h1>Stats</h1>
        <p>Total CPU Usage: {res.totalCpuUsage}</p>
        <p>Total Memory Usage: {res.totalMemoryUsage}</p>
        <p>Total Memory Limit: {res.totalMemoryLimit}</p>
        
    </div>
  )
}

export default page