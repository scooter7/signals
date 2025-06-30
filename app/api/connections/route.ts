import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { checkAndAwardBadges, calculateSignalScore } from '@/lib/gamification';

// POST - Create a new connection request
export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { addressee_id } = await request.json();
  if (!addressee_id || addressee_id === user.id) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { error } = await supabase
    .from('connections')
    .insert({ requester_id: user.id, addressee_id: addressee_id, status: 'pending' });

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'A connection request already exists.' }, { status: 409 });
    console.error('Error creating connection:', error);
    return NextResponse.json({ error: 'Failed to create connection.' }, { status: 500 });
  }

  revalidatePath('/network');
  return NextResponse.json({ message: 'Connection request sent' }, { status: 201 });
}

// PATCH - Update a connection status (accept/decline)
export async function PATCH(request: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { id, status } = await request.json();
    if (!id || !['accepted', 'declined'].includes(status)) {
        return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    const { data: connection, error } = await supabase
        .from('connections')
        .update({ status: status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('addressee_id', user.id) // Security check
        .select('*, requester:profiles!connections_requester_id_fkey(full_name), addressee:profiles!connections_addressee_id_fkey(full_name)')
        .single();

    if (error || !connection) {
        console.error('Error updating connection:', error);
        return NextResponse.json({ error: 'Failed to update connection' }, { status: 500 });
    }

    // --- ADD ACTIVITY LOG FOR BOTH USERS ---
    if (status === 'accepted') {
        await supabase.from('activity_feed').insert([
            // Log for the user who accepted the request
            {
                user_id: connection.addressee_id,
                event_type: 'connection_accepted',
                event_description: `You are now connected with ${connection.requester.full_name}.`,
                related_user_id: connection.requester_id
            },
            // Log for the user who sent the request
            {
                user_id: connection.requester_id,
                event_type: 'connection_accepted',
                event_description: `Your connection request with ${connection.addressee.full_name} was accepted.`,
                related_user_id: connection.addressee_id
            }
        ]);
    }
    // --- END ACTIVITY LOG ---

    revalidatePath('/network');
    revalidatePath('/dashboard');
    return NextResponse.json({ message: 'Connection updated' }, { status: 200 });
}