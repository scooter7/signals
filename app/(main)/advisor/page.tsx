import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import AIChatClient from '@/components/advisor/AIChatClient';
import { Database } from '@/lib/database.types';

// Define a comprehensive type for the user's full profile
export type FullUserProfile = {
  profile: Database['public']['Tables']['profiles']['Row'];
  experiences: Database['public']['Tables']['experiences']['Row'][];
  courses: Database['public']['Tables']['courses']['Row'][];
  interests: { name: string }[];
};

export default async function AdvisorPage() {
  const supabase = createClient(); // FIX: No argument needed

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  // Fetch all user data in parallel
  const [profileData, experiencesData, coursesData, interestsData] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', session.user.id).single(),
    supabase.from('experiences').select('*').eq('user_id', session.user.id),
    supabase.from('courses').select('*').eq('user_id', session.user.id),
    supabase.from('user_interests')
      .select('interests(name)')
      .eq('user_id', session.user.id)
  ]);

  if (profileData.error || experiencesData.error || coursesData.error || interestsData.error) {
    console.error('Error fetching user profile data:', 
      profileData.error || experiencesData.error || coursesData.error || interestsData.error
    );
    return <div>Error loading your data. Please try again.</div>;
  }
  
  const userProfile: FullUserProfile = {
    profile: profileData.data,
    experiences: experiencesData.data || [],
    courses: coursesData.data || [],
    interests: (interestsData.data?.map(i => i.interests) || []).filter(Boolean) as { name: string }[],
  };

  return (
    <div>
      <div className="flex items-center mb-6">
        <Sparkles className="w-8 h-8 mr-4 text-amber-500" />
        <h1 className="text-3xl font-bold text-gray-800">AI Career & College Advisor</h1>
      </div>
      <p className="mb-6 text-gray-600">
        Ask for advice based on your profile. You can ask things like "What are some good career paths for me?" or "Suggest some suitable college majors."
      </p>
      
      <AIChatClient userProfile={userProfile} />
    </div>
  );
}
