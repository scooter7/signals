import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

// POST - Create a new portfolio item
export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { title, description, link_url } = await request.json();

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('portfolio_items')
    .insert({
      user_id: session.user.id,
      title,
      description,
      link_url,
    });

  if (error) {
    console.error('Error creating portfolio item:', error);
    return NextResponse.json({ error: 'Failed to create item.' }, { status: 500 });
  }

  // Revalidate the portfolio page to show the new item
  revalidatePath('/portfolio');

  return NextResponse.json({ message: 'Item created' }, { status: 201 });
}


// DELETE - Remove a portfolio item
export async function DELETE(request: Request) {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
        return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    // Verify the user owns the item before deleting
    const { error } = await supabase
        .from('portfolio_items')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id);

    if (error) {
        console.error('Error deleting portfolio item:', error);
        return NextResponse.json({ error: 'Failed to delete item.' }, { status: 500 });
    }

    revalidatePath('/portfolio');
    return NextResponse.json({ message: 'Item deleted' }, { status: 200 });
}