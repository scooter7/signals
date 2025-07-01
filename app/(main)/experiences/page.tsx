import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Briefcase, GraduationCap, Star, Users } from 'lucide-react';
import ExperienceForm from '@/components/dashboard/ExperienceForm';
import { Database } from '@/lib/database.types';
import ExperienceItem from '@/components/dashboard/ExperienceItem';

export type Experience = Database['public']['Tables']['experiences']['Row'];
type ExperienceType = Database['public']['Enums']['experience_type'];
type Interest = Database['public']['Tables']['interests']['Row'];

const experienceIcons: Record<ExperienceType, React.ElementType> = {
  academic: GraduationCap,
  extracurricular: Star,
  internship: Briefcase,
  work: Briefcase,
  project: Star,
  volunteer: Users,
};

export default async function ExperiencesPage() {
  const supabase = createClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  // Fetch experiences and all interests in parallel
  const [experiencesData, interestsData] = await Promise.all([
    supabase
      .from('experiences')
      .select('*')
      .eq('user_id', session.user.id)
      .order('start_date', { ascending: false }),
    supabase.from('interests').select('*').order('name'),
  ]);

  const { data: experiences, error: experiencesError } = experiencesData;
  const { data: interests, error: interestsError } = interestsData;

  if (experiencesError || interestsError) {
    console.error('Error fetching data:', experiencesError || interestsError);
    return <div>Error loading experiences.</div>;
  }

  const groupedExperiences = (experiences || []).reduce((acc, exp) => {
    const type = exp.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(exp);
    return acc;
  }, {} as Record<ExperienceType, Experience[]>);

  return (
    <div>
      <div className="flex items-center mb-8">
        <Briefcase className="w-8 h-8 mr-4 text-indigo-600" />
        <h1 className="text-3xl font-bold text-gray-800">My Experiences</h1>
      </div>
      
      <div className="bg-white p-8 rounded-xl shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Add a New Experience</h2>
        <ExperienceForm interests={interests || []} />
      </div>

      <div className="space-y-8">
        {Object.entries(groupedExperiences).map(([type, exps]) => {
          const Icon = experienceIcons[type as ExperienceType];
          return (
            <div key={type}>
              <h2 className="text-xl font-semibold text-gray-700 mb-4 capitalize flex items-center">
                <Icon className="w-6 h-6 mr-3 text-indigo-500" />
                {type} Experiences
              </h2>
              <div className="space-y-4">
                {exps.map(exp => (
                  <ExperienceItem key={exp.id} experience={exp} interests={interests || []} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
