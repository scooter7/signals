// scooter7/signals/signals-ff56013aed11c73aa30372363d7b35c2180d897a/app/api/trigger-score-update/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { checkAndAwardBadges, calculateActivityScore } from '@/lib/gamification';
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
  const newActivityScore = await calculateActivityScore(userId, supabase);
  const { error } = await supabase.from('profiles').update({ activity_score: newActivityScore }).eq('id', userId);

  if (error) {
    return NextResponse.json({ error: 'Failed to update score' }, { status: 500 });
  }

  revalidatePath('/dashboard');
  return NextResponse.json({ message: 'Score updated' });
}