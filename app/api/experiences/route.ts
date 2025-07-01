import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { checkAndAwardBadges, calculateActivityScore } from '@/lib/gamification';

// POST - Create a new experience
export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body = await request.json();
  const userId = user.id;

  if (!body.title || !body.type || !body.start_date) {
    return NextResponse.json({ error: 'Title, type, and start date are required.' }, { status: 400 });
  }

  const { data: newExperience, error } = await supabase
    .from('experiences')
    .insert({ 
      ...body, 
      user_id: userId,
      interest_id: body.interest_id || null 
    })
    .select()
    .single();

  if (error || !newExperience) {
    console.error('Error creating experience:', error);
    return NextResponse.json({ error: 'Failed to create experience.' }, { status: 500 });
  }

  // --- Activity Logging & Scoring ---
  await supabase.from('activity_feed').insert({
    user_id: userId,
    event_type: 'experience_added',
    event_description: `added a new experience: ${newExperience.title}`
  });
  await checkAndAwardBadges(userId, supabase);
  const newActivityScore = await calculateActivityScore(userId, supabase);
  await supabase.from('profiles').update({ activity_score: newActivityScore }).eq('id', userId);
  // --- End Logic ---

  revalidatePath('/experiences');
  revalidatePath('/dashboard');
  return NextResponse.json({ message: 'Experience created' }, { status: 201 });
}

// PATCH - Update an existing experience
export async function PATCH(request: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    
    const body = await request.json();
    const { id, ...updateData } = body;
    const userId = user.id;

    if (!id) return NextResponse.json({ error: 'Experience ID is required.' }, { status: 400 });

    const { error } = await supabase.from('experiences').update({
      ...updateData,
      interest_id: updateData.interest_id || null
    }).eq('id', id).eq('user_id', userId);

    if (error) return NextResponse.json({ error: 'Failed to update experience.' }, { status: 500 });

    await checkAndAwardBadges(userId, supabase);
    const newActivityScore = await calculateActivityScore(userId, supabase);
    await supabase.from('profiles').update({ activity_score: newActivityScore }).eq('id', userId);

    revalidatePath('/experiences');
    revalidatePath('/dashboard');
    return NextResponse.json({ message: 'Experience updated' }, { status: 200 });
}

// DELETE - Remove an experience
export async function DELETE(request: Request) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { id } = await request.json();
    const userId = user.id;
    if (!id) return NextResponse.json({ error: 'Experience ID is required.' }, { status: 400 });

    const { error } = await supabase.from('experiences').delete().eq('id', id).eq('user_id', userId);
    if (error) return NextResponse.json({ error: 'Failed to delete experience.' }, { status: 500 });

    await checkAndAwardBadges(userId, supabase);
    const newActivityScore = await calculateActivityScore(userId, supabase);
    await supabase.from('profiles').update({ activity_score: newActivityScore }).eq('id', userId);

    revalidatePath('/experiences');
    revalidatePath('/dashboard');
    return NextResponse.json({ message: 'Experience deleted' }, { status: 200 });
}
