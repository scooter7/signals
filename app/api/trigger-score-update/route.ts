import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { checkAndAwardBadges, calculateSignalScore } from '@/lib/gamification';
import { revalidatePath } from 'next/cache';

// This route's only job is to recalculate the user's score.
export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const userId = user.id;

  await checkAndAwardBadges(userId, supabase);
  const newSignalScore = await calculateSignalScore(userId, supabase);
  const { error } = await supabase.from('profiles').update({ signal_score: newSignalScore }).eq('id', userId);

  if (error) {
    return NextResponse.json({ error: 'Failed to update score' }, { status: 500 });
  }

  revalidatePath('/dashboard');
  return NextResponse.json({ message: 'Score updated' });
}