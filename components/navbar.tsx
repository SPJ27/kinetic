import Image from 'next/image'
import React from 'react'

const Navbar = ({image, admin}: {image: string; admin: boolean}) => {
  return (
    <div className='w-full flex px-6 lg:px-40 items-center justify-between py-4'>
        <div className=''>
             <h1 className='text-4xl'>Kinetic.</h1>
        </div>
        <div className='flex items-center gap-2'>
            <span className='bg-neutral-800 px-3.5 text-xs py-0.5 rounded-full text-white'>{admin && 'Admin'}</span>
            <Image src={image} alt="Profile" width={40} height={40} className='rounded-full '/>
        </div>
    </div>
  )
}

export default Navbar