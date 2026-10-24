import React from 'react'

const page = () => {
  return (
    <div className='w-full max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md'>
        <form className='bg-red-50 flex flex-col gap-1.5'>
            <input type="text" placeholder="GitHub URL" name="githubUrl" />
            <input type="text" placeholder="Project Name" name="projectName" />
            <input type="number" placeholder="Port" name="port" />
            <button type="submit">Deploy</button>
        </form>
    </div>
  )
}

export default page