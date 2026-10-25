"use client"

import { RealtimeProvider } from "@neon/realtime-react"
import { realtimeClient } from "@/lib/realtime-client"

export default function RealtimeProviders({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RealtimeProvider client={realtimeClient}>
      {children}
    </RealtimeProvider>
  )
}