// scooter7/signals/signals-ff56013aed11c73aa30372363d7b35c2180d897a/app/api/log-ai-activity/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { checkAndAwardBadges, calculateActivityScore } from '@/lib/gamification';
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
  const newActivityScore = await calculateActivityScore(userId, supabase);
  await supabase.from('profiles').update({ activity_score: newActivityScore }).eq('id', userId);
  // --- End Logic ---

  revalidatePath('/dashboard');
  return NextResponse.json({ message: 'Activity logged' });
}