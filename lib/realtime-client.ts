import { createRealtimeClient } from "@neon/realtime/client"
import { drizzleParsers } from "@neon/realtime-drizzle/client"

export const realtimeClient = createRealtimeClient({
  url: process.env.NEXT_PUBLIC_NEON_REALTIME_URL!,
  parsers: { ...drizzleParsers },
})