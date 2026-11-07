import { createProject } from '@/actions/projects'

import { getRepos } from '@/lib/github'
import { requireSession } from '@/lib/require-session'

import RepoSelector from '@/components/repo-selector'


const page = async () => {
  const session = await requireSession()
  const admin = session?.user?.role === 'admin'


  if (admin) {
    const repos = await getRepos()
    console.log(repos)
    return (
      <RepoSelector repos={repos} />
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