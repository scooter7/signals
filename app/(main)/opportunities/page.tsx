import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Briefcase, Building, MapPin, ExternalLink } from 'lucide-react';
import { Database } from '@/lib/database.types';
import OpportunityForm from '@/components/opportunities/OpportunityForm';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export type Opportunity = Database['public']['Tables']['opportunities']['Row'] & {
  profiles: { company_name: string | null } | null;
};
export type UserRole = Database['public']['Enums']['user_role'];


export default async function OpportunitiesPage() {
  const supabase = createClient(); // FIX: No argument needed

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_name:full_name')
    .eq('id', session.user.id)
    .single();

  const { data: opportunities, error } = await supabase
    .from('opportunities')
    .select(`
      *,
      profiles (
        company_name:full_name
      )
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching opportunities:', error);
    return <div>Error loading opportunities. Please try again.</div>;
  }

  const userIsRecruiter = profile?.role === 'college_recruiter' || profile?.role === 'corporate_recruiter';

  return (
    <div>
      <div className="flex items-center mb-8">
        <Briefcase className="w-8 h-8 mr-4 text-cyan-600" />
        <h1 className="text-3xl font-bold text-gray-800">Opportunities</h1>
      </div>

      {userIsRecruiter && (
        <div className="bg-white p-8 rounded-xl shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Post a New Opportunity</h2>
          <OpportunityForm companyName={profile?.company_name || ''} />
        </div>
      )}

      <div className="space-y-6">
        {opportunities.map((opp) => (
          <Card key={opp.id}>
            <CardHeader>
              <CardTitle className="text-xl">{opp.title}</CardTitle>
              <CardDescription className="flex items-center space-x-4 pt-1">
                <span className="flex items-center"><Building className="w-4 h-4 mr-2" />{opp.company_name}</span>
                <span className="flex items-center"><MapPin className="w-4 h-4 mr-2" />{opp.location}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{opp.description}</p>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
                <span className="text-sm font-medium bg-cyan-100 text-cyan-800 px-3 py-1 rounded-full capitalize">{opp.type}</span>
                {opp.application_url && (
                    <Button asChild variant="link">
                        <a href={opp.application_url} target="_blank" rel="noopener noreferrer">
                            Apply Now <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                    </Button>
                )}
            </CardFooter>
          </Card>
        ))}
        {opportunities.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <p className="text-gray-500">No opportunities posted yet.</p>
                {userIsRecruiter ? (
                    <p className="text-gray-500">Post one above to get started!</p>
                ) : (
                    <p className="text-gray-500">Check back soon!</p>
                )}
            </div>
        )}
      </div>
    </div>
  );
}
