'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../utils/supabase/client'
import Image from 'next/image'
import { login } from './action'

export default function LoginPage() {
  const router = useRouter()
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function checkSession() {
      const { data } = await supabase.auth.getUser()
      if (data?.user) {
        router.replace(`/dashboard/${data.user.id}`)
      } else {
        setCheckingSession(false)
      }
    }

    checkSession()
  }, [router])

  if (checkingSession) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Checking session...</p>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center h-screen  bg-white">
      <div className="w-[500px] h-[450px] p-6 rounded-lg drop-shadow-xl bg-fantasy backdrop-blur-md">
        <div className="flex justify-center">
          <Image src="/logo.png" alt="logo" width={200} height={50} />
        </div>
        <div className="flex justify-center mt-7">
          <h1 className='font-bold text-lg'>Log in with your account</h1>
        </div>
        <form className="flex flex-col gap-4 mt-6">
          <label htmlFor="email" className="font-medium text-lg">Email:</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="bg-white p-2 rounded-md"
          />

          <label htmlFor="password" className="font-medium text-lg">Password:</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="bg-white p-2 rounded-md"
          />

          <div className="flex justify-end gap-2 mt-3">
            {/* <button
              // formAction={signup}
              onClick={() => router.push('signup')}
              className="bg-gray-300 border-2 border-inherit outline outline-offset-2 text-black px-4 py-2 rounded-md hover:bg-gray-400 cursor-pointer"
            >
              Sign up
            </button> */}
            <a onClick={() => router.push('signup')} className='cursor-pointer flex items-center text-lg text-strongblue hover:underline'>Don't have an account? Sign up!</a>
            <button
              formAction={login}
              className="bg-shipgrey text-white px-4 py-2 rounded-md w-36 cursor-pointer"
            >
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
