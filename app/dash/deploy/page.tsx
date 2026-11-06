import { createProject } from '@/actions/projects'
import { auth } from '@/lib/auth/auth'
import { getRepos } from '@/lib/github'
import { requireSession } from '@/lib/require-session'
import { headers } from 'next/headers'
import React from 'react'
import { FaGithub } from 'react-icons/fa'



const page = async () => {
  const session = await requireSession()
  const admin = session?.user?.role === 'admin'

  if (admin) {
    const repos = await getRepos()
    console.log(repos)
    return (
      <div className='mx-auto px-6 lg:px-40 w-full'>
        <p className='text-2xl' >Your Repositories</p>
        <div className='max-w-xs w-full mt-3'>
          {repos.slice(0, 6).map((repo: GithubProjects) =>
          (
            <div key={repo.url} className='bg-neutral-50 py-2 w-full border-y border-neutral-200/60 px-5'>

              <h1 className='flex items-center gap-1 text-xl tracking-wide'><FaGithub /> {repo.name}</h1>
              <p className='text-xs tracking-wide text-neutral-400'>{repo.url}</p>
            </div>

          )
          )}
        </div>
      </div>
    )
  }


  return (
    <div className='w-full max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md'>
      <form className=' flex flex-col gap-1.5' action={createProject}>
        <input type="text" placeholder="GitHub URL" name="githubUrl" className='border px-2 py-0.5 border-neutral-200 ' />
        <input type="text" placeholder="Subdomain" name="subdomain" className='border px-2 py-0.5 border-neutral-200 ' />
        <button type="submit">Deploy</button>
      </form>
    </div>
  )
}

export default page