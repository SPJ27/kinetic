import RealtimeProviders from "@/components/realtime-provider"

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <RealtimeProviders>{children}</RealtimeProviders>
      </body>
    </html>
  )
}