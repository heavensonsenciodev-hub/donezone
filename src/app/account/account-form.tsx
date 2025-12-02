'use client'
import { useCallback, useEffect, useState } from 'react'
import { createClient } from '../../../utils/supabase/client'
import { type User } from '@supabase/supabase-js'
import { signup } from '../login/action'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { useRouter } from 'next/navigation'

export default function AccountForm({ user }: { user: User | null }) {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [fullname, setFullname] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [website, setWebsite] = useState<string | null>(null)
  const [avatar_url, setAvatarUrl] = useState<string | null>(null)
  const router = useRouter()
  
  const getProfile = useCallback(async () => {
    // ✅ Prevent bad request when user is undefined
    if (!user?.id) {
      console.warn('User not loaded yet — skipping profile fetch')
      return
    }

    try {
      setLoading(true)

      const { data, error, status } = await supabase
        .from('profiles')
        .select('full_name, username, website, avatar_url')
        .eq('id', user.id) // ✅ user.id is guaranteed to exist now
        .single()

      if (error && status !== 406) {
        console.error('Supabase error:', error)
        throw error
      }

      if (data) {
        setFullname(data.full_name)
        setUsername(data.username)
        setWebsite(data.website)
        setAvatarUrl(data.avatar_url)
      }
    } catch (error) {
      console.error('Error loading user data:', error)
      alert('Error loading user data!')
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  // ✅ Only fetch profile when user exists
  useEffect(() => {
    if (user) getProfile()
  }, [user, getProfile])

  async function updateProfile({
    username,
  }: {
    username: string | null
  }) {
    if (!user?.id) {
      alert('No user found!')
      return
    }

    try {
      setLoading(true)

      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        username,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error
      alert('Profile updated!')
      router.push('/login')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Error updating the data!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="border w-[400px] h-[400px] p-6 rounded-lg shadow-md bg-white">
        {/* <div className="flex justify-center pb-6">
          <Image src="/logo.png" alt="logo" width={200} height={50} />
        </div> */}
        <div className="flex-justify-start pb-6">
          <h5 className='text-2xl font-extrabold text-gray-700'>Setup Your Account Information</h5>
        </div>

        <form action="" className='flex flex-col gap-4'>
          <label htmlFor="email" className='font-bold'>Email</label>
          <input type="email" id='email' name='email' className='border p-2 rounded-md text-gray-600' value={user?.email || ''} disabled/>
          <label htmlFor="username" className='font-bold'>Username</label>
          <input type="username" id='username' name='username' className='border p-2 rounded-md' value={username || ''} onChange={(e) => setUsername(e.target.value)}/>

          <div className="flex justify-end mt-3">
            <button className='border bg-blue-500 p-2 rounded-md text-white cursor-pointer' type='button' onClick={() => updateProfile({ username })} disabled={loading}>
              {loading ? 'Loading ...' : 'Confirm Account'}
            </button>
          </div>
        </form>
      </div>
      {/* <div className="form-widget">
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" type="text" value={user?.email || ''} disabled />
        </div>

        <div>
          <label htmlFor="fullName">Full Name</label>
          <input
            id="fullName"
            type="text"
            value={fullname || ''}
            onChange={(e) => setFullname(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username || ''}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="website">Website</label>
          <input
            id="website"
            type="url"
            value={website || ''}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        <div>
          <button
            className="button primary block"
            onClick={() => updateProfile({ fullname, username, website, avatar_url })}
            disabled={loading}
          >
            {loading ? 'Loading ...' : 'Sign Up'}
          </button>
        </div>

        <div>
          <form action="/auth/signout" method="post">
            <button className="button block" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </div> */}
    </div>



  )
}
