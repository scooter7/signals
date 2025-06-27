import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Users } from 'lucide-react';
import { Database } from '@/lib/database.types';
import UserCard from '@/components/network/UserCard';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Connection = Database['public']['Tables']['connections']['Row'];

export default async function NetworkPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  // 1. Get all of the current user's connections (sent or received)
  const { data: connections, error: connectionsError } = await supabase
    .from('connections')
    .select('requester_id, addressee_id, status')
    .or(`requester_id.eq.${session.user.id},addressee_id.eq.${session.user.id}`);
    
  if (connectionsError) {
    console.error('Error fetching connections:', connectionsError);
    return <div>Error loading network.</div>;
  }

  // Create a set of user IDs the current user is already connected with or has a pending request with.
  const connectedUserIds = new Set(
    (connections || []).flatMap(c => [c.requester_id, c.addressee_id])
  );
  // Also add the current user's own ID to the set to exclude them from the list.
  connectedUserIds.add(session.user.id);

  // 2. Get all profiles *not* in the connectedUserIds set.
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .not('id', 'in', `(${Array.from(connectedUserIds).map(id => `'${id}'`).join(',')})`);

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
    return <div>Error loading network.</div>;
  }
  
  return (
    <div>
      <div className="flex items-center mb-8">
        <Users className="w-8 h-8 mr-4 text-purple-600" />
        <h1 className="text-3xl font-bold text-gray-800">Discover Connections</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {(profiles || []).map(profile => (
          <UserCard 
            key={profile.id} 
            profile={profile}
          />
        ))}
        {(profiles || []).length === 0 && (
            <div className="col-span-full text-center py-12 border-2 border-dashed rounded-lg">
                <p className="text-gray-500">No new users to connect with right now.</p>
                <p className="text-gray-500">Check back later!</p>
            </div>
        )}
      </div>
    </div>
  );
}