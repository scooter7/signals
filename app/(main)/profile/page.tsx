import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ProfileEditor from '@/components/dashboard/ProfileEditor';
import { User } from 'lucide-react';

export default async function ProfilePage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error || !profile) {
    // This could happen if a profile wasn't created on signup.
    // You might want to handle this more gracefully.
    console.error('Error fetching profile:', error);
    return <div>Error loading profile. Please try again later.</div>;
  }

  return (
    <div>
      <div className="flex items-center mb-8">
        <User className="w-8 h-8 mr-4 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-md">
        <ProfileEditor profile={profile} />
      </div>
    </div>
  );
}
