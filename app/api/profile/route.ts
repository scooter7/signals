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

  // Pass the supabase client to both gamification functions
  await checkAndAwardBadges(userId, supabase);
  const newSignalScore = await calculateSignalScore(userId, supabase);

  // Perform a single update to the database with all new information
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name,
      username,
      headline,
      bio,
      role,
      signal_score: newSignalScore,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile.' }, { status: 500 });
  }

  // Invalidate the server cache to ensure fresh data is loaded on navigation
  revalidatePath('/', 'layout');
  revalidatePath('/profile');
  revalidatePath('/opportunities');

  return NextResponse.json({ message: 'Profile updated successfully' }, { status: 200 });
}