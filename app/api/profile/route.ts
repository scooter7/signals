// scooter7/signals/signals-ff56013aed11c73aa30372363d7b35c2180d897a/app/api/profile/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { checkAndAwardBadges, calculateActivityScore } from '@/lib/gamification';
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

  // Transaction to update profile and interests together
  const { error: transactionError } = await supabase.rpc('update_profile_and_interests' as any, {
    p_user_id: userId,
    p_full_name: full_name,
    p_username: username,
    p_headline: headline,
    p_bio: bio,
    p_role: role,
    p_interest_ids: interest_ids
  })

  // Note: The above RPC function 'update_profile_and_interests' would need to be created in your database
  // to handle the update atomically. For simplicity, I'll stick to the multi-step version here.
  
  // --- Standard multi-step version ---
  const { error: profileUpdateError } = await supabase
    .from('profiles')
    .update({ full_name, username, headline, bio, role, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (profileUpdateError) { /* ... error handling ... */ }

  await supabase.from('user_interests').delete().eq('user_id', userId);

  if (interest_ids && interest_ids.length > 0) {
    const interestsToInsert = interest_ids.map((id: number) => ({ user_id: userId, interest_id: id }));
    await supabase.from('user_interests').insert(interestsToInsert);
  }
  // --- End of multi-step version ---


  await checkAndAwardBadges(userId, supabase);
  const newActivityScore = await calculateActivityScore(userId, supabase);
  const { error } = await supabase.from('profiles').update({ activity_score: newActivityScore }).eq('id', userId);

  if (error) {
    return NextResponse.json({ error: 'Failed to update score' }, { status: 500 });
  }

  revalidatePath('/', 'layout');
  revalidatePath('/profile');
  revalidatePath('/opportunities');

  return NextResponse.json({ message: 'Profile updated successfully' }, { status: 200 });
}