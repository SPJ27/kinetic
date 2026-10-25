"use client"

import { useLiveQuery } from "@neon/realtime-react"
import { LogStream, type LogLine } from "@/components/ballmac/log-stream"
import type { SealedLiveQuery } from "@neon/realtime"

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
  const { data } = useLiveQuery(sealedQuery)

  const lines: LogLine[] = (data ?? []).map((log) => ({
    id: log.id,
    time: new Date(log.createdAt).getTime(),
    level: log.logType === "stderr" ? "error" : "info",
    source: log.type ?? "deploy",
    message: log.output ?? "",
  }))

  return (
    <LogStream
      title="Deployment logs"
      lines={lines}
      height="24rem"
    />
  )
}