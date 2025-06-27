import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Logo } from '@/components/ui/Logo'; // <-- Import the new Logo component

export default async function HomePage() {
  const supabase = createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-blue-50 to-white">
      <header className="p-4 flex justify-between items-center">
        <Logo /> {/* <-- Use the Logo component */}
        <nav>
          <Link href="/login" className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
            Sign In
          </Link>
        </nav>
      </header>
      <main className="flex flex-col items-center justify-center text-center px-4" style={{minHeight: '80vh'}}>
        <h2 className="text-5xl font-extrabold text-gray-800 mb-4">
          Chart Your Course to Success
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Connect with opportunities, showcase your achievements, and build your future. Your journey starts here.
        </p>
        <Link href="/signup" className="bg-purple-600 text-white font-bold py-3 px-8 rounded-full text-lg hover:bg-purple-700 transition-transform transform hover:scale-105">
          Get Started for Free
        </Link>
      </main>
    </div>
  );
}
