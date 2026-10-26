import Image from 'next/image'
import React from 'react'

const Navbar = ({image}: {image: string}) => {
  return (
    <div className='w-full flex items-center justify-between py-4'>
        <div className=''>
             <h1 className='text-4xl'>Kinetic.</h1>
        </div>
        <div>
            <Image src={image} alt="Profile" width={40} height={40} className='rounded-full '/>
        </div>
    </div>
  )
}

export default Navbar