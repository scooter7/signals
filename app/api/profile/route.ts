import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { checkAndAwardBadges, calculateSignalScore } from '@/lib/gamification';
import { revalidatePath } from 'next/cache';

export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { full_name, username, headline, bio, role, interest_ids } = await request.json();
  const userId = session.user.id;

  // 1. Update the main profile information
  const { error: profileUpdateError } = await supabase
    .from('profiles')
    .update({
      full_name,
      username,
      headline,
      bio,
      role,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (profileUpdateError) {
    console.error('Error updating profile:', profileUpdateError);
    return NextResponse.json({ error: 'Failed to update profile.' }, { status: 500 });
  }

  // 2. Clear existing interests for the user
  const { error: deleteError } = await supabase
    .from('user_interests')
    .delete()
    .eq('user_id', userId);

  if (deleteError) {
      console.error('Error clearing user interests:', deleteError);
      return NextResponse.json({ error: 'Failed to update interests.' }, { status: 500 });
  }

  // 3. Insert the new set of interests if any were provided
  if (interest_ids && interest_ids.length > 0) {
      const interestsToInsert = interest_ids.map((interest_id: number) => ({
          user_id: userId,
          interest_id: interest_id,
      }));

      const { error: insertError } = await supabase
          .from('user_interests')
          .insert(interestsToInsert);

      if (insertError) {
          console.error('Error inserting user interests:', insertError);
          return NextResponse.json({ error: 'Failed to update interests.' }, { status: 500 });
      }
  }

  // 4. Update gamification stats and revalidate cached paths
  await checkAndAwardBadges(userId, supabase);
  const newSignalScore = await calculateSignalScore(userId, supabase);
  await supabase.from('profiles').update({ signal_score: newSignalScore }).eq('id', userId);
  
  revalidatePath('/', 'layout');
  revalidatePath('/profile');
  revalidatePath('/opportunities');

  return NextResponse.json({ message: 'Profile updated successfully' }, { status: 200 });
}