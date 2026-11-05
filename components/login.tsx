'use client'
import { authClient } from '@/lib/auth/auth-client'


const Login = () => {
  return (
        <div className="flex min-h-screen items-center justify-center">
          <button
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-700"
            onClick={() =>
              authClient.signIn.social({
                provider: 'github',
                callbackURL: '/',
              })
            }
          >
            Sign in with GitHub
          </button>
        </div>
      )
}

export default Login