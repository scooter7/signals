import SignupForm from '@/components/auth/SignupForm'
import Link from 'next/link'

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Create Your Account</h1>
            <p className="text-gray-600">Join a network of students and recruiters.</p>
        </div>
        <div className="bg-white p-8 rounded-xl shadow-md">
            <SignupForm />
        </div>
        <p className="text-center mt-4 text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
