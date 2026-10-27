import { createRealtimeClient } from "@neon/realtime/client"
import { drizzleParsers } from "@neon/realtime-drizzle/client"

console.log({
  hasSecret: Boolean(process.env.NEON_REALTIME_SECRET),
  realtimeUrl: process.env.NEXT_PUBLIC_NEON_REALTIME_URL,
})

export const realtimeClient = createRealtimeClient({
  url: process.env.NEXT_PUBLIC_NEON_REALTIME_URL!,
  parsers: { ...drizzleParsers },
})