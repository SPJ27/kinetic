
"use client"

import { useLiveQuery } from "@neon/realtime-react"
import type { SealedLiveQuery } from "@neon/realtime"
import { LogStream, type LogLine } from "@/components/ballmac/log-stream"

type LogRow = {
  id: string
  output: string | null
  type: string | null
  projectId: string
  createdAt: Date
  logType: string
}

export default function ProjectLogs({
  sealedQuery,
}: {
  sealedQuery: SealedLiveQuery<LogRow>
}) {
  const { data, error, status } = useLiveQuery(sealedQuery)

if (status === "error") {
  return (
    <pre className="text-red-500 whitespace-pre-wrap">
      {error?.message ?? "Realtime subscription failed"}
    </pre>
  )
}

if (data === undefined) {
  return <div>Connecting to realtime logs...</div>
}
  if (error) {
    return (
      <pre className="whitespace-pre-wrap text-sm text-red-500">
        Realtime error: {String(error)}
      </pre>
    )
  }

  

  const lines: LogLine[] = (data ?? []).map((log) => ({
    id: log.id,
    time: new Date(log.createdAt).getTime(),
    level: log.logType === "stderr" ? "error" : "info",
    source: log.type ?? "deploy",
    message: log.output ?? "",
  }))

  return (
    <div>
      <div className="mb-2 text-xs text-neutral-500">
        Realtime rows: {data?.length ?? 0}
      </div>
      <LogStream
        title="Deployment logs"
        lines={lines}
        height="24rem"
      />
    </div>
  )
}
