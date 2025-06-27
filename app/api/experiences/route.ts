import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

// POST - Create a new experience
export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json();

  if (!body.title || !body.type || !body.start_date) {
    return NextResponse.json({ error: 'Title, type, and start date are required.' }, { status: 400 });
  }

  const { error } = await supabase
    .from('experiences')
    .insert({
      user_id: session.user.id,
      title: body.title,
      type: body.type,
      organization: body.organization,
      start_date: body.start_date,
      end_date: body.end_date,
      is_current: body.is_current,
      description: body.description,
    });

  if (error) {
    console.error('Error creating experience:', error);
    return NextResponse.json({ error: 'Failed to create experience.' }, { status: 500 });
  }

  revalidatePath('/experiences');
  return NextResponse.json({ message: 'Experience created' }, { status: 201 });
}

// PATCH - Update an existing experience
export async function PATCH(request: Request) {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
        return NextResponse.json({ error: 'Experience ID is required.' }, { status: 400 });
    }

    const { error } = await supabase
        .from('experiences')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', session.user.id); // Ensure user owns the record

    if (error) {
        console.error('Error updating experience:', error);
        return NextResponse.json({ error: 'Failed to update experience.' }, { status: 500 });
    }

    revalidatePath('/experiences');
    return NextResponse.json({ message: 'Experience updated' }, { status: 200 });
}

// DELETE - Remove an experience
export async function DELETE(request: Request) {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
        return NextResponse.json({ error: 'Experience ID is required.' }, { status: 400 });
    }

    const { error } = await supabase
        .from('experiences')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id); // Ensure user owns the record

    if (error) {
        console.error('Error deleting experience:', error);
        return NextResponse.json({ error: 'Failed to delete experience.' }, { status: 500 });
    }

    revalidatePath('/experiences');
    return NextResponse.json({ message: 'Experience deleted' }, { status: 200 });
}