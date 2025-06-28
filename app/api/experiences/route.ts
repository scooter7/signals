import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { checkAndAwardBadges, calculateSignalScore } from '@/lib/gamification';

// POST - Create a new experience
export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json();
  const userId = session.user.id;

  if (!body.title || !body.type || !body.start_date) {
    return NextResponse.json({ error: 'Title, type, and start date are required.' }, { status: 400 });
  }

  const { error } = await supabase
    .from('experiences')
    .insert({ ...body, user_id: userId });

  if (error) {
    console.error('Error creating experience:', error);
    return NextResponse.json({ error: 'Failed to create experience.' }, { status: 500 });
  }

  // --- ADD SCORING LOGIC ---
  await checkAndAwardBadges(userId, supabase);
  const newSignalScore = await calculateSignalScore(userId, supabase);
  await supabase.from('profiles').update({ signal_score: newSignalScore }).eq('id', userId);
  // --- END SCORING LOGIC ---

  revalidatePath('/experiences');
  revalidatePath('/dashboard'); // Revalidate dashboard to show new score
  return NextResponse.json({ message: 'Experience created' }, { status: 201 });
}

// PATCH, DELETE functions... (they should also have the scoring logic added)
// For brevity, I'll show the PATCH example. You should add the same block to DELETE.
export async function PATCH(request: Request) {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    
    const body = await request.json();
    const { id, ...updateData } = body;
    const userId = session.user.id;

    if (!id) return NextResponse.json({ error: 'Experience ID is required.' }, { status: 400 });

    const { error } = await supabase.from('experiences').update(updateData).eq('id', id).eq('user_id', userId);
    if (error) return NextResponse.json({ error: 'Failed to update experience.' }, { status: 500 });

    // --- ADD SCORING LOGIC ---
    await checkAndAwardBadges(userId, supabase);
    const newSignalScore = await calculateSignalScore(userId, supabase);
    await supabase.from('profiles').update({ signal_score: newSignalScore }).eq('id', userId);
    // --- END SCORING LOGIC ---

    revalidatePath('/experiences');
    revalidatePath('/dashboard');
    return NextResponse.json({ message: 'Experience updated' }, { status: 200 });
}

export async function DELETE(request: Request) {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { id } = await request.json();
    const userId = session.user.id;
    if (!id) return NextResponse.json({ error: 'Experience ID is required.' }, { status: 400 });

    const { error } = await supabase.from('experiences').delete().eq('id', id).eq('user_id', userId);
    if (error) return NextResponse.json({ error: 'Failed to delete experience.' }, { status: 500 });

    // --- ADD SCORING LOGIC ---
    await checkAndAwardBadges(userId, supabase);
    const newSignalScore = await calculateSignalScore(userId, supabase);
    await supabase.from('profiles').update({ signal_score: newSignalScore }).eq('id', userId);
    // --- END SCORING LOGIC ---

    revalidatePath('/experiences');
    revalidatePath('/dashboard');
    return NextResponse.json({ message: 'Experience deleted' }, { status: 200 });
}