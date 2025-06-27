'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Add user's full name to their metadata
        // This will be used by the database trigger to create their profile
        data: {
          full_name: fullName,
        }
      }
    })

    if (error) {
      setError(error.message)
    } else if (data.user) {
        if (data.user.identities?.length === 0) {
            setError("This email address is already in use. Please try logging in.")
        } else {
            setMessage("Success! Please check your email to confirm your account.")
            // You might want to disable the form here
        }
    }
  }

  return (
    <form onSubmit={handleSignUp} className="space-y-4">
      {error && <p className="bg-red-100 text-red-700 p-3 rounded-md">{error}</p>}
      {message && <p className="bg-green-100 text-green-800 p-3 rounded-md">{message}</p>}
      <div className="space-y-1">
        <label htmlFor="fullName" className="text-sm font-medium">Full Name</label>
        <Input
          id="fullName"
          name="fullName"
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Jane Doe"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium">Email</label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium">Password</label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>
      <Button type="submit" className="w-full">
        Create Account
      </Button>
    </form>
  )
}
