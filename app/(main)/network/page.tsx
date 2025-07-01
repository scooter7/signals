import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Users, UserPlus, ArrowRight, Check } from 'lucide-react';
import { Database } from '@/lib/database.types';
import UserCard from '@/components/network/UserCard';
import ConnectionList from '@/components/network/ConnectionList';
import { calculateCompatibilityScore } from '@/lib/gamification';

// Define base types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ConnectionWithProfile = Database['public']['Tables']['connections']['Row'] & {
  requester: Profile;
  addressee: Profile;
};

// Define a new, more detailed type for profiles that includes interests and the new dynamic score
export type ProfileWithInterests = Profile & {
  user_interests: { interest_id: number }[];
  compatibility_score?: number;
};

export default async function NetworkPage() {
  const supabase = createClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const currentUserId = session.user.id;

  // 1. Fetch current user's profile with interests for comparison
  const { data: currentUserProfile, error: currentUserError } = await supabase
    .from('profiles')
    .select('*, user_interests(interest_id)')
    .eq('id', currentUserId)
    .single();
  
  if (currentUserError || !currentUserProfile) {
    console.error('Error fetching current user profile:', currentUserError);
    return <div>Error loading your profile. Please try again.</div>;
  }

  // 2. Fetch all of the user's existing connections
  const { data: allConnections, error: connectionsError } = await supabase
    .from('connections')
    .select(`
      *,
      requester:profiles!connections_requester_id_fkey(*),
      addressee:profiles!connections_addressee_id_fkey(*)
    `)
    .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`);
    
  if (connectionsError) {
    console.error('Error fetching connections:', connectionsError);
    return <div>Error loading network.</div>;
  }

  // 3. Fetch all other users and their interests
  const { data: allOtherProfiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*, user_interests(interest_id)')
    .neq('id', currentUserId);

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
    return <div>Error loading network.</div>;
  }

  // 4. Create a Set of IDs for users who are already connected in some way
  const connectedUserIds = new Set(
    (allConnections || []).map(c => c.requester_id === currentUserId ? c.addressee_id : c.requester_id)
  );

  // 5. Filter for discoverable profiles, calculate their compatibility score, and sort them
  const discoverProfiles = (allOtherProfiles || [])
    .filter(p => !connectedUserIds.has(p.id))
    .map(p => {
        // The compatibility score is boosted by the user's general activity score
        const compatibility_score = calculateCompatibilityScore(currentUserProfile, p) + (p.activity_score || 0);
        return { ...p, compatibility_score };
    })
    .sort((a, b) => (b.compatibility_score || 0) - (a.compatibility_score || 0));

  // 6. Prepare connection lists for the UI
  const incomingRequests = (allConnections || []).filter(c => c.addressee_id === currentUserId && c.status === 'pending');
  const acceptedConnections = (allConnections || []).filter(c => c.status === 'accepted');

  return (
    <div className="space-y-12">
      {/* Incoming Requests Section */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
          <ArrowRight className="w-6 h-6 mr-3 text-blue-500 transform -rotate-45" />
          Incoming Connection Requests
        </h2>
        <ConnectionList connections={incomingRequests} currentUserId={currentUserId} type="incoming" />
      </div>

      {/* My Connections Section */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
          <Check className="w-6 h-6 mr-3 text-green-500" />
          My Connections
        </h2>
        <ConnectionList connections={acceptedConnections} currentUserId={currentUserId} type="accepted" />
      </div>

      {/* Discover New Connections Section */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
          <UserPlus className="w-6 h-6 mr-3 text-purple-500" />
          Discover New Connections
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {discoverProfiles.map(profile => (
            <UserCard key={profile.id} profile={profile as ProfileWithInterests} />
          ))}
          {discoverProfiles.length === 0 && (
              <div className="col-span-full text-center py-12">
                  <p className="text-gray-500">No new users to connect with right now.</p>
              </div>
          )}
        </div>
      </div>
    </div>
  );
}
