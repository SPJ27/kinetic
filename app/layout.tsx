import RealtimeProviders from "@/components/realtime-provider"
import "./globals.css"
import { Instrument_Serif } from "next/font/google"


const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: "400" })

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={instrumentSerif.className}>
        <RealtimeProviders>{children}</RealtimeProviders>
      </body>
    </html>
  )
}