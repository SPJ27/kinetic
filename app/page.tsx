'use client'
import Navbar from '@/components/navbar';
import { authClient } from '@/lib/auth/auth-client'
import React from 'react'

const page = () => {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div>Loading...</div>
    )
  }
  if (!session) { 
    return (
      <div>
        <button onClick={() => authClient.signIn.social({provider: 'github', callbackURL: '/'})}>Sign In</button>
      </div>
    )
  }

  console.log(session)
  return (
    <div className='px-40'>
      <Navbar image={session.user.image || ''} />
    </div>
  )
}

export default page