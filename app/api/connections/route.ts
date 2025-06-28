import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

// POST - Create a new connection request
export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { addressee_id } = await request.json();

  if (!addressee_id || addressee_id === session.user.id) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { error } = await supabase
    .from('connections')
    .insert({
      requester_id: session.user.id,
      addressee_id: addressee_id,
      status: 'pending',
    });

  if (error) {
    if (error.code === '23505') {
        return NextResponse.json({ error: 'A connection request already exists.' }, { status: 409 });
    }
    console.error('Error creating connection:', error);
    return NextResponse.json({ error: 'Failed to create connection.' }, { status: 500 });
  }

  revalidatePath('/network');
  return NextResponse.json({ message: 'Connection request sent' }, { status: 201 });
}

// PATCH - Update a connection status (accept/decline)
export async function PATCH(request: Request) {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id, status } = await request.json();

    if (!id || !['accepted', 'declined'].includes(status)) {
        return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    // Update the connection status WHERE the current user is the addressee
    const { error } = await supabase
        .from('connections')
        .update({ status: status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('addressee_id', session.user.id); // Security check: only the receiver can accept/decline

    if (error) {
        console.error('Error updating connection:', error);
        return NextResponse.json({ error: 'Failed to update connection' }, { status: 500 });
    }

    revalidatePath('/network');
    return NextResponse.json({ message: 'Connection updated' }, { status: 200 });
}
