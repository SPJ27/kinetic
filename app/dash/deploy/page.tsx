import { createProject } from '@/actions/projects'
import { auth } from '@/lib/auth/auth'
import { headers } from 'next/headers'
import React from 'react'

const page = async () => {
  const session = await auth.api.getSession({ headers: await headers() })
  const admin = session?.user?.role === 'admin'

  

  return (
    <div className='w-full max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md'>
        <form className=' flex flex-col gap-1.5' action={createProject}>
            <input type="text" placeholder="GitHub URL" name="githubUrl" className='border px-2 py-0.5 border-neutral-200 '/>
            <input type="text" placeholder="Subdomain" name="subdomain" className='border px-2 py-0.5 border-neutral-200 '/>
            <button type="submit">Deploy</button>
        </form>
    </div>
  )
}

export default page