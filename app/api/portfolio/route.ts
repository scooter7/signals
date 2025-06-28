import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { checkAndAwardBadges, calculateSignalScore } from '@/lib/gamification';

// POST - Create a new portfolio item
export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { title, description, link_url } = await request.json();
  const userId = session.user.id;

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('portfolio_items')
    .insert({ user_id: userId, title, description, link_url });

  if (error) {
    console.error('Error creating portfolio item:', error);
    return NextResponse.json({ error: 'Failed to create item.' }, { status: 500 });
  }

  // --- ADD SCORING LOGIC ---
  await checkAndAwardBadges(userId, supabase);
  const newSignalScore = await calculateSignalScore(userId, supabase);
  await supabase.from('profiles').update({ signal_score: newSignalScore }).eq('id', userId);
  // --- END SCORING LOGIC ---

  revalidatePath('/portfolio');
  revalidatePath('/dashboard');
  return NextResponse.json({ message: 'Item created' }, { status: 201 });
}

// DELETE - Remove a portfolio item
export async function DELETE(request: Request) {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { id } = await request.json();
    const userId = session.user.id;
    if (!id) return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });

    const { error } = await supabase.from('portfolio_items').delete().eq('id', id).eq('user_id', userId);
    if (error) return NextResponse.json({ error: 'Failed to delete item.' }, { status: 500 });

    // --- ADD SCORING LOGIC ---
    await checkAndAwardBadges(userId, supabase);
    const newSignalScore = await calculateSignalScore(userId, supabase);
    await supabase.from('profiles').update({ signal_score: newSignalScore }).eq('id', userId);
    // --- END SCORING LOGIC ---

    revalidatePath('/portfolio');
    revalidatePath('/dashboard');
    return NextResponse.json({ message: 'Item deleted' }, { status: 200 });
}