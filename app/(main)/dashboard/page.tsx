import { createClient } from '@/lib/supabase/server';
import { Newspaper, UserCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Database } from '@/lib/database.types';

// Define a type for activity that includes the nested profile information
type ActivityWithProfile = Database['public']['Tables']['activity_feed']['Row'] & {
  profile: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

export default async function DashboardPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Fetch the user's profile and the latest activity feed items in parallel
  const [profileData, activityData] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    supabase.from('activity_feed')
      .select('*, profile:profiles!user_id(full_name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(5)
  ]);
  
  const profile = profileData.data;
  // Cast the activity data to our specific type to ensure type safety
  const activities = activityData.data as ActivityWithProfile[] | null;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        Welcome back, {profile?.full_name || 'User'}!
      </h1>
      <p className="text-gray-600 mb-8">
        This is your dashboard. Here you'll find updates, recommendations, and a summary of your progress.
      </p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column for Activity Feed */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center mb-4">
                    <Newspaper className="w-6 h-6 mr-3 text-blue-500" />
                    <h2 className="font-semibold text-lg text-gray-800">Recent Activity</h2>
                </div>
                <div className="space-y-4">
                    {activities && activities.length > 0 ? (
                        activities.map(activity => (
                            <div key={activity.id} className="flex items-center space-x-3">
                                <img 
                                    src={activity.profile?.avatar_url || `https://placehold.co/40x40/E2E8F0/4A5568?text=${activity.profile?.full_name?.charAt(0) || '?'}`} 
                                    alt="avatar" 
                                    className="w-10 h-10 rounded-full" 
                                />
                                <div>
                                    <p className="text-sm text-gray-800">
                                        <span className="font-semibold">{activity.profile?.full_name}</span> {activity.event_description}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {activity.created_at ? formatDistanceToNow(new Date(activity.created_at), { addSuffix: true }) : ''}
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

        {/* Right Column for Recommendations */}
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center mb-4">
                    <UserCheck className="w-6 h-6 mr-3 text-purple-500" />
                    <h2 className="font-semibold text-lg text-gray-800">Recommended Connections</h2>
                </div>
                <p className="text-sm text-gray-500">
                    You can find new people to connect with on the {' '}
                    <Link href="/network" className="text-blue-600 hover:underline font-medium">
                        Network page
                    </Link>
                    .
                </p>
            </div>
        </div>
      </div>
    </div>
  );
}
