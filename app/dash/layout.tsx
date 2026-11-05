import { Instrument_Serif } from "next/font/google"
import { requireSession} from "@/lib/require-session"
import Navbar from "@/components/navbar"


const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: "400" })

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireSession()
  const admin = session?.user?.role === 'admin'

  return (
    <html lang="en">
      <body className={instrumentSerif.className}>
        <Navbar image={session.user.image || ''} admin={admin} />
       {children}
      </body>
    </html>
  )
}