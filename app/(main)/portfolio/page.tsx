import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { FileText, Award } from 'lucide-react';
import PortfolioView from '@/components/portfolio/PortfolioView';
import { Database } from '@/lib/database.types';

export type PortfolioItem = Database['public']['Tables']['portfolio_items']['Row'];
export type EarnedBadge = Database['public']['Tables']['user_badges']['Row'] & {
  badges: {
    name: string;
    description: string;
    icon_url: string | null;
  } | null;
};
type Interest = Database['public']['Tables']['interests']['Row'];


export default async function PortfolioPage() {
  const supabase = createClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const [portfolioData, badgesData, interestsData] = await Promise.all([
    supabase
      .from('portfolio_items')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('user_badges')
      .select(`*, badges (name, description, icon_url)`)
      .eq('user_id', session.user.id),
    supabase.from('interests').select('*').order('name'),
  ]);

  const portfolioItems = portfolioData.data || [];
  const earnedBadges = (badgesData.data as EarnedBadge[]) || [];
  const interests = interestsData.data || [];

  return (
    <div>
      <div className="flex items-center mb-8">
        <FileText className="w-8 h-8 mr-4 text-green-600" />
        <h1 className="text-3xl font-bold text-gray-800">My Portfolio</h1>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
          <Award className="mr-3 text-yellow-500" />
          My Badges
        </h2>
        {earnedBadges.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {earnedBadges.map(b => b.badges && (
              <div key={b.badge_id} className="text-center p-4 bg-white rounded-lg shadow-sm border" title={`${b.badges.name}: ${b.badges.description}`}>
                <img src={b.badges.icon_url || ''} alt={b.badges.name} className="w-16 h-16 mx-auto mb-2" />
                <p className="font-semibold text-sm text-gray-700">{b.badges.name}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No badges earned yet. Complete your profile to get started!</p>
        )}
      </div>

      <p className="mb-6 text-gray-600">
        Showcase your best work. Add projects, papers, presentations, or any other evidence of your skills and achievements.
      </p>

      <PortfolioView initialItems={portfolioItems} interests={interests} />
    </div>
  );
}
