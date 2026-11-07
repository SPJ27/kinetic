
import Metrics from '@/components/metrics'
import Navbar from '@/components/navbar'
import { db } from '@/db'
import { projects } from '@/db/schema'
import { auth } from '@/lib/auth/auth'
import Login from '@/components/login'
import { headers } from 'next/headers'
import { and, eq, ne } from 'drizzle-orm'
import { Inter } from 'next/font/google'
import { FaGithub } from 'react-icons/fa'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import DeleteProject from '@/components/delete-project'

const inter = Inter({ subsets: ['latin'] })

const page = async () => {
  const session = await auth.api.getSession({ headers: await headers() })


  if (!session) {
    redirect('/')
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
    where: and(eq(projects.userId, session.user.id), ne(projects.status, 'deleted')),
    with: {
      deployments: true,
    },
  })
  console.log(userProjects)
  const admin = session.user.role === 'admin'
  return (
    <div className="min-h-screen px-6 lg:px-40">

      <div className="mt-3 grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">

        {stats.map((stat) => (
          <Metrics key={stat.title} {...stat} />
        ))}
      </div>
      <div className='text-[28px] flex items-center tracking-lightest mt-6 justify-between'>
        <h1>Projects</h1>
        <Link href='/dash/deploy' className='rounded-sm bg-neutral-900 px-4 py-1 text-sm tracking-wide text-white hover:bg-neutral-800'>+ New</Link>
      </div>

      <div className="mt-3 grid w-full grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-3">
        {userProjects.map((project) => (
          <div key={project.id} className='transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-neutral-50/30 active:translate-y-0 active:scale-[0.99] hover:shadow-md hover:cursor-pointer rounded-sm border border-neutral-200/30 bg-white p-5 shadow-sm w-full  px-7 py-3'>
            <div className='flex justify-between'>
              <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className={`font-light hover:underline underline-offset-2 text-xs text-neutral-400 ${inter.className} flex gap-1 items-center`}><FaGithub /> {project.githubUrl}</a>
              <DeleteProject projectId={project.id} />
            </div>

            <h1 className='text-[32px] font-bold mt-3 border-t border-neutral-100 pt-2'>{project.name}</h1>
            <p className={`font-light text-xs text-neutral-400 border-b border-neutral-100 pb-4 ${inter.className}`}>{project.subdomain}.app.sakshamjain.dev</p>
            
            <div className={`font-light text-xs flex gap-1 items-center text-neutral-400 mt-2 ${inter.className}`}>
              {project.status === 'active' && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />}
              {project.status === 'failed' && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />}
              {project.status === 'pending' && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-500" />}

              <span className='text-neutral-500 font-normal'>{project.commit?.substring(0, 7)}</span> • {project.deployments[0]?.createdAt && new Date(project.deployments[0]?.createdAt).toDateString()} {admin && `• Port ${project.port}`}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default page