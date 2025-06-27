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

  if (!addressee_id) {
    return NextResponse.json({ error: 'Addressee ID is required' }, { status: 400 });
  }
  
  if (addressee_id === session.user.id) {
    return NextResponse.json({ error: 'You cannot connect with yourself.' }, { status: 400 });
  }

  const { error } = await supabase
    .from('connections')
    .insert({
      requester_id: session.user.id,
      addressee_id: addressee_id,
      status: 'pending',
    });

  if (error) {
    // The unique index might throw an error if a connection already exists.
    if (error.code === '23505') { // unique_violation
        return NextResponse.json({ error: 'A connection request already exists with this user.' }, { status: 409 });
    }
    console.error('Error creating connection:', error);
    return NextResponse.json({ error: 'Failed to create connection.' }, { status: 500 });
  }

  revalidatePath('/network');
  return NextResponse.json({ message: 'Connection request sent' }, { status: 201 });
}