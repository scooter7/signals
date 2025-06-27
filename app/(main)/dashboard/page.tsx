import { createClient } from '@/lib/supabase/server';
import { TrendingUp } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = createClient(); // FIX: No argument needed

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, signal_score')
    .eq('id', user?.id || '')
    .single();

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        Welcome back, {profile?.full_name || 'User'}!
      </h1>
      <p className="text-gray-600">
        This is your dashboard. Here you'll find updates, recommendations, and a summary of your progress.
      </p>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center mb-2">
                <TrendingUp className="w-6 h-6 mr-3 text-green-500" />
                <h2 className="font-semibold text-lg">My Signal Score</h2>
            </div>
            <p className="text-4xl font-bold text-gray-800">{profile?.signal_score || 0}</p>
            <p className="text-sm text-gray-500 mt-1">This score helps recruiters find you. Keep building your profile to increase it!</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="font-semibold text-lg mb-2">Recent Activity</h2>
            <p className="text-sm text-gray-600">No new activity.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="font-semibold text-lg mb-2">Recommended Connections</h2>
            <p className="text-sm text-gray-600">No recommendations yet.</p>
        </div>
      </div>
    </div>
  );
}
