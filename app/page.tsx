
import Metrics from '@/components/metrics'
import Navbar from '@/components/navbar'
import { db } from '@/db'
import { projects } from '@/db/schema'
import { authClient } from '@/lib/auth/auth-client'
import { requireSession } from '@/lib/require-session'
import { eq } from 'drizzle-orm'
import { Inter } from 'next/font/google'
import { FaGithub } from 'react-icons/fa'

const inter = Inter({ subsets: ['latin'] })

const page = async () => {
  const session = await requireSession()


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


  const userProjects = await db.query.projects.findMany({
    where: eq(projects.userId, session.user.id),
    with: {
      deployments: true,
    },
  })
  console.log(userProjects)
  const admin = session.user.role === 'admin'
  return (
    <div className="min-h-screen px-6 lg:px-40">
      <Navbar image={session.user.image || ''} admin={admin} />

      <div className="mt-3 grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">

        {stats.map((stat) => (
          <Metrics key={stat.title} {...stat} />
        ))}
      </div>
      <div className='text-[28px] tracking-lightest mt-6'>Projects</div>

      <div className="mt-3 grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {userProjects.map((project) => (
        <div key={project.id} className='transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-neutral-50/30 active:translate-y-0 active:scale-[0.99] hover:shadow-md hover:cursor-pointer rounded-sm border border-neutral-200/30 bg-white p-5 shadow-sm  px-7 py-3'>
          <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className={`font-light hover:underline underline-offset-2 text-xs text-neutral-400 ${inter.className} flex gap-1 items-center`}><FaGithub /> {project.githubUrl}</a>

          <h1 className='text-[32px] font-bold mt-3 border-t border-neutral-100 pt-2'>{project.name}</h1>
          <p className={`font-light text-xs text-neutral-400 border-b border-neutral-100 pb-4 ${inter.className}`}>{project.subdomain}.app.sakshamjain.dev</p>
          <div className={`font-light text-xs flex gap-1 items-center text-neutral-400 mt-2 ${inter.className}`}>
            {project.status === 'active' && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />}
            <span className='text-neutral-500 font-normal'>{project.commit?.substring(0, 7)}</span> • {project.deployments[0]?.createdAt && new Date(project.deployments[0]?.createdAt).toDateString()} {admin && `• Port ${project.port}`}</div>
        </div>
        ))}
      </div>
    </div>
  )
}

export default page