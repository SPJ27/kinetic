import { createRealtime } from "@neon/realtime/server"
import { drizzleAdapter } from "@neon/realtime-drizzle"



export const realtime = createRealtime({
  db: "neondb",
  secret: process.env.NEON_REALTIME_SECRET!,
  adapter: drizzleAdapter(),
})