import { createClient } from '@/lib/supabase/server';
import { TrendingUp, Newspaper, Users, UserCheck } from 'lucide-react'; // Import new icons
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null; // Or redirect

  // Fetch profile and activity feed in parallel
  const [profileData, activityData] = await Promise.all([
    supabase.from('profiles').select('full_name, signal_score').eq('id', user.id).single(),
    supabase.from('activity_feed')
      .select('*, profiles(full_name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(5) // Get the 5 most recent activities
  ]);
  
  const profile = profileData.data;
  const activities = activityData.data;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        Welcome back, {profile?.full_name || 'User'}!
      </h1>
      <p className="text-gray-600">
        This is your dashboard. Here you'll find updates, recommendations, and a summary of your progress.
      </p>
      
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
            {/* Recent Activity Card */}
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center mb-4">
                    <Newspaper className="w-6 h-6 mr-3 text-blue-500" />
                    <h2 className="font-semibold text-lg">Recent Activity</h2>
                </div>
                <div className="space-y-4">
                    {activities && activities.length > 0 ? (
                        activities.map(activity => (
                            <div key={activity.id} className="flex items-center space-x-3">
                                <img src={activity.profiles?.avatar_url || `https://placehold.co/40x40/E2E8F0/4A5568?text=${activity.profiles?.full_name?.charAt(0)}`} alt="avatar" className="w-10 h-10 rounded-full" />
                                <div>
                                    <p className="text-sm text-gray-800">
                                        <span className="font-semibold">{activity.profiles?.full_name}</span> {activity.event_description}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-gray-500">No recent activity from you or your connections.</p>
                    )}
                </div>
            </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
            {/* Signal Score Card */}
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center mb-2">
                    <TrendingUp className="w-6 h-6 mr-3 text-green-500" />
                    <h2 className="font-semibold text-lg">My Signal Score</h2>
                </div>
                <p className="text-4xl font-bold text-gray-800">{profile?.signal_score || 0}</p>
                <p className="text-sm text-gray-500 mt-1">This score helps recruiters find you. Keep building your profile to increase it!</p>
            </div>
            {/* Recommended Connections Card */}
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center mb-4">
                    <UserCheck className="w-6 h-6 mr-3 text-purple-500" />
                    <h2 className="font-semibold text-lg">Recommended Connections</h2>
                </div>
                {/* We will build the logic for this next */}
                <p className="text-sm text-gray-500">No recommendations yet.</p>
            </div>
        </div>
      </div>
    </div>
  );
}
