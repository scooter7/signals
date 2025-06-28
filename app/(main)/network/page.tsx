import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Users, UserPlus, ArrowRight, Check } from 'lucide-react';
import { Database } from '@/lib/database.types';
import UserCard from '@/components/network/UserCard';
import ConnectionList from '@/components/network/ConnectionList';

// Define types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ConnectionWithProfile = Database['public']['Tables']['connections']['Row'] & {
  requester: Profile;
  addressee: Profile;
};

export default async function NetworkPage() {
  const supabase = createClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const currentUserId = session.user.id;

  // --- START: REVISED LOGIC ---

  // 1. Fetch all connections related to the current user to populate the top sections
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

  // 2. Fetch ALL other user profiles from the database
  const { data: allOtherProfiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .neq('id', currentUserId);

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
    return <div>Error loading network.</div>;
  }

  // 3. Create a Set of IDs for users who are already in a connection (pending, accepted, etc.)
  const connectedUserIds = new Set(
    (allConnections || []).flatMap(c => [c.requester_id, c.addressee_id])
  );

  // 4. Filter the profiles in JavaScript to find users you have NO connection with
  const discoverProfiles = (allOtherProfiles || []).filter(p => !connectedUserIds.has(p.id));
  
  // --- END: REVISED LOGIC ---

  // Filter connections into different lists for the UI
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

      {/* Accepted Connections Section */}
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
            <UserCard key={profile.id} profile={profile} />
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