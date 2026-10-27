import { createProject } from '@/actions/projects'
import React from 'react'

const page = () => {
  return (
    <div className='w-full max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md'>
        <form className=' flex flex-col gap-1.5' action={createProject}>
            <input type="text" placeholder="GitHub URL" name="githubUrl" className='border px-2 py-0.5 border-neutral-200 '/>
            <button type="submit">Deploy</button>
        </form>
    </div>
  )
}

export default page