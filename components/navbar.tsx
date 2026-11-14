import Image from 'next/image'
import Link from 'next/link'

const Navbar = ({image, admin}: {image: string; admin: boolean}) => {
  return (
    <div className='w-full flex px-6 lg:px-40 items-center justify-between py-4'>
        <div className=''>
             <Link href="/dash" className='text-4xl'>Kinetic.</Link>
        </div>
        <div className='flex items-center gap-2'>
            <Image src={image} alt="Profile" width={40} height={40} className='rounded-full '/>
        </div>
    </div>
  )
}

export default Navbar