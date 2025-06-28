import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

// POST - Create a new opportunity
export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Backend check for user role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (profile?.role !== 'college_recruiter' && profile?.role !== 'corporate_recruiter') {
    return NextResponse.json({ error: 'You are not authorized to post opportunities.' }, { status: 403 });
  }

  const body = await request.json();

  // Basic validation
  if (!body.title || !body.type || !body.description) {
    return NextResponse.json({ error: 'Title, type, and description are required.' }, { status: 400 });
  }

  const { error } = await supabase
    .from('opportunities')
    .insert({
      created_by: session.user.id,
      title: body.title,
      type: body.type,
      company_name: body.company_name,
      location: body.location,
      application_url: body.application_url,
      description: body.description,
    });

  if (error) {
    console.error('Error creating opportunity:', error);
    return NextResponse.json({ error: 'Failed to create opportunity.' }, { status: 500 });
  }

  revalidatePath('/opportunities');
  return NextResponse.json({ message: 'Opportunity created' }, { status: 201 });
}