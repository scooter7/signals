import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { checkAndAwardBadges, calculateSignalScore } from '@/lib/gamification';
import { revalidatePath } from 'next/cache';

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const userId = user.id;

  // --- Activity Logging & Scoring ---
  await supabase.from('activity_feed').insert({
    user_id: userId,
    event_type: 'ai_advisor_used',
    event_description: 'used the AI Advisor for career advice.'
  });
  await checkAndAwardBadges(userId, supabase);
  const newSignalScore = await calculateSignalScore(userId, supabase);
  await supabase.from('profiles').update({ signal_score: newSignalScore }).eq('id', userId);
  // --- End Logic ---

  revalidatePath('/dashboard');
  return NextResponse.json({ message: 'Activity logged' });
}