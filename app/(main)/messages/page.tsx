import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import { Database } from '@/lib/database.types';
import MessagingClient from '@/components/messaging/MessagingClient';

// Define a more detailed type for our connections list
export type ConnectionWithProfile = {
  id: number;
  status: string;
  profile: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    headline: string | null;
  }
}

export default async function MessagesPage() {
  const supabase = createClient(); // FIX: No argument needed

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  // Fetch all ACCEPTED connections for the current user
  const { data: connections, error } = await supabase
    .from('connections')
    .select(`
      id,
      status,
      profile:profiles!connections_addressee_id_fkey (
        id,
        full_name,
        avatar_url,
        headline
      )
    `)
    .eq('requester_id', session.user.id)
    .eq('status', 'accepted');

  const { data: connectionsOf, error: connectionsOfError } = await supabase
    .from('connections')
    .select(`
      id,
      status,
      profile:profiles!connections_requester_id_fkey (
        id,
        full_name,
        avatar_url,
        headline
      )
    `)
    .eq('addressee_id', session.user.id)
    .eq('status', 'accepted');

  if (error || connectionsOfError) {
    console.error('Error fetching connections:', error || connectionsOfError);
    return <div>Error loading messages.</div>;
  }

  // Combine the two lists of connections
  const allConnections = [...(connections || []), ...(connectionsOf || [])] as ConnectionWithProfile[];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center mb-6 flex-shrink-0">
        <MessageSquare className="w-8 h-8 mr-4 text-pink-600" />
        <h1 className="text-3xl font-bold text-gray-800">Messages</h1>
      </div>
      
      <div className="flex-grow h-full">
         <MessagingClient connections={allConnections} currentUserId={session.user.id} />
      </div>
    </div>
  );
}
