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

  const { full_name, username, headline, bio, role } = await request.json();
  const userId = session.user.id;

  // 1. First, check for and award any new badges based on the incoming data.
  // We do this first so the subsequent score calculation is accurate.
  await checkAndAwardBadges(userId);
  
  // 2. Now, calculate the new signal score.
  const newSignalScore = await calculateSignalScore(userId, supabase);

  // 3. Perform a SINGLE update to the database with all new information.
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name,
      username,
      headline,
      bio,
      role,
      signal_score: newSignalScore, // Include the newly calculated score
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile.' }, { status: 500 });
  }

  // 4. Invalidate the server cache for the layout and specific pages.
  // This ensures the next navigation loads fresh data.
  revalidatePath('/', 'layout');
  revalidatePath('/profile');
  revalidatePath('/opportunities');

  return NextResponse.json({ message: 'Profile updated successfully' }, { status: 200 });
}