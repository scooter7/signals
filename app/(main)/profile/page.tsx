import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ProfileEditor from '@/components/dashboard/ProfileEditor';
import { User } from 'lucide-react';
import { Database } from '@/lib/database.types';

export default async function ProfilePage() {
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const userId = session.user.id;

  // Fetch profile, all interests, and the user's selected interests in parallel
  const [profileData, interestsData, userInterestsData] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('interests').select('*').order('name'),
    supabase.from('user_interests').select('interest_id').eq('user_id', userId),
  ]);

  const { data: profile, error: profileError } = profileData;
  const { data: allInterests, error: interestsError } = interestsData;
  const { data: userInterests, error: userInterestsError } = userInterestsData;

  if (profileError || !profile || interestsError || userInterestsError) {
    console.error('Error fetching profile data:', profileError || interestsError || userInterestsError);
    return <div>Error loading profile. Please try again later.</div>;
  }

  // Extract just the IDs for easier handling in the editor
  const userInterestIds = userInterests.map(interest => interest.interest_id);

  return (
    <div>
      <div className="flex items-center mb-8">
        <User className="w-8 h-8 mr-4 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-md">
        <ProfileEditor
          profile={profile}
          allInterests={allInterests || []}
          userInterestIds={userInterestIds}
        />
      </div>
    </div>
  );
}