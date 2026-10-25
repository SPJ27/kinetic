import { createRealtime } from "@neon/realtime/server"
import { drizzleAdapter } from "@neon/realtime-drizzle"

export const realtime = createRealtime({
  db: "logs",
  secret: process.env.NEON_REALTIME_SECRET!,
  adapter: drizzleAdapter(),
})