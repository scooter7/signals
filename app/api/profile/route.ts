import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { checkAndAwardBadges, calculateAndUpdateSignalScore } from '@/lib/gamification'; // Import both functions

export async function POST(request: Request) {
  const supabase = createClient();

  // 1. Get the current user's session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 2. If no user is logged in, return an error
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // 3. Get the updated profile data from the form submission
  const { full_name, username, headline, bio } = await request.json();

  // 4. Update the user's profile in the 'profiles' table
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name,
      username,
      headline,
      bio,
      updated_at: new Date().toISOString(),
    })
    .eq('id', session.user.id);

  // 5. If there was a database error, log it and return an error response
  if (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile.' }, { status: 500 });
  }

  // 6. After successfully updating the profile, check for and award new badges
  await checkAndAwardBadges(session.user.id);

  // 7. Then, recalculate and update the user's signal score
  await calculateAndUpdateSignalScore(session.user.id);

  // 8. Return a success response
  return NextResponse.json({ message: 'Profile updated successfully' }, { status: 200 });
}
