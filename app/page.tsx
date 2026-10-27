'use client'

import Metrics from '@/components/metrics'
import Navbar from '@/components/navbar'
import { authClient } from '@/lib/auth/auth-client'

const page = () => {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) {
    return <div className="p-6 text-sm text-neutral-500">Loading...</div>
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <button
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-700"
          onClick={() =>
            authClient.signIn.social({
              provider: 'github',
              callbackURL: '/',
            })
          }
        >
          Sign in with GitHub
        </button>
      </div>
    )
  }

 const cpuHistory = [
  { time: '00:00', usage: 12 },
  { time: '04:00', usage: 8 },
  { time: '08:00', usage: 24 },
  { time: '12:00', usage: 67 },
  { time: '16:00', usage: 42 },
  { time: '20:00', usage: 81 },
  { time: '24:00', usage: 36 },
]

const memoryHistory = [
  { time: '00:00', usage: 42 },
  { time: '04:00', usage: 43 },
  { time: '08:00', usage: 47 },
  { time: '12:00', usage: 52 },
  { time: '16:00', usage: 49 },
  { time: '20:00', usage: 61 },
  { time: '24:00', usage: 58 },
]

const networkHistory = [
  { time: '00:00', usage: 12 },
  { time: '04:00', usage: 8 },
  { time: '08:00', usage: 35 },
  { time: '12:00', usage: 62 },
  { time: '16:00', usage: 45 },
  { time: '20:00', usage: 88 },
  { time: '24:00', usage: 54 },
]

const diskHistory = [
  { time: '00:00', usage: 5 },
  { time: '04:00', usage: 12 },
  { time: '08:00', usage: 18 },
  { time: '12:00', usage: 42 },
  { time: '16:00', usage: 28 },
  { time: '20:00', usage: 56 },
  { time: '24:00', usage: 34 },
]

const stats = [
  {
    title: 'CPU Usage',
    value: '36.00%',
    change: '↓ 8.2% from previous period',
    desc: 'Processor utilization',
    data: cpuHistory,
  },
  {
    title: 'Memory Usage',
    value: '594 MiB',
    change: '58% of 1 GiB limit',
    desc: 'Memory currently allocated',
    data: memoryHistory,
  },
  {
    title: 'Network I/O',
    value: '128.4 MB',
    change: '84.2 MB received · 44.2 MB sent',
    desc: 'Cumulative network traffic',
    data: networkHistory,
  },
  {
    title: 'Block I/O',
    value: '246.8 MB',
    change: '198.4 MB read · 48.4 MB written',
    desc: 'Cumulative disk read/write activity',
    data: diskHistory,
  }
]

  return (
    <div className="min-h-screen px-6 lg:px-40">
      <Navbar image={session.user.image || ''} />

      <div className="mt-6 grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Metrics key={stat.title} {...stat} />
        ))}
      </div>
    </div>
  )
}

export default page