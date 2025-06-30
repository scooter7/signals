// scooter7/signals/signals-e14ad08976b81031ca9347e5cf5e70b329218bfc/lib/gamification.ts
import { createClient } from '@/lib/supabase/server';
import { Database } from './database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Badge = Database['public']['Tables']['badges']['Row'];

// Helper function to check if a user's profile meets badge criteria
const checkProfileBadge = (badge: Badge, profile: Profile): boolean => {
    if (!badge.criteria || typeof badge.criteria !== 'object' || !('fields' in badge.criteria)) {
        return false;
    }
    const requiredFields = badge.criteria.fields as string[];
    return requiredFields.every(field => profile[field as keyof Profile]);
};

// Helper function to check if experience count meets badge criteria
const checkExperienceBadge = async (badge: Badge, userId: string, supabase: any): Promise<boolean> => {
    if (!badge.criteria || typeof badge.criteria !== 'object' || !('count' in badge.criteria)) {
        return false;
    }
    const requiredCount = badge.criteria.count as number;
    const { count, error } = await supabase
        .from('experiences')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
    
    if (error) return false;
    return count >= requiredCount;
};

// Helper function to check if portfolio item count meets badge criteria
const checkPortfolioBadge = async (badge: Badge, userId: string, supabase: any): Promise<boolean> => {
    if (!badge.criteria || typeof badge.criteria !== 'object' || !('count' in badge.criteria)) {
        return false;
    }
    const requiredCount = badge.criteria.count as number;
    const { count, error } = await supabase
        .from('portfolio_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    if (error) return false;
    return count >= requiredCount;
};

// Helper function to check if interest count meets badge criteria
const checkInterestBadge = async (badge: Badge, userId:string, supabase: any): Promise<boolean> => {
    if (!badge.criteria || typeof badge.criteria !== 'object' || !('count' in badge.criteria)) {
        return false;
    }
    const requiredCount = badge.criteria.count as number;
    const { count, error } = await supabase
        .from('user_interests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    if (error) return false;
    return count >= requiredCount;
};

// Main function to check and award badges
export async function checkAndAwardBadges(userId: string, supabase: any) {
    const { data: allBadges, error: badgesError } = await supabase.from('badges').select('*');
    const { data: userProfile, error: profileError } = await supabase.from('profiles').select('*').eq('id', userId).single();
    
    if (badgesError || profileError || !allBadges || !userProfile) {
        console.error("Error fetching data for badge check:", badgesError || profileError);
        return;
    }

    const { data: earnedBadges, error: earnedError } = await supabase
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', userId);

    if (earnedError) {
        console.error("Error fetching earned badges:", earnedError);
        return;
    }
    
    const earnedBadgeIds = new Set((earnedBadges || []).map((b: { badge_id: number }) => b.badge_id));

    const badgesToCheck = allBadges.filter((badge: Badge) => !earnedBadgeIds.has(badge.id));
    const badgesToAward: number[] = [];

    for (const badge of badgesToCheck) {
        let earned = false;
        const criteria = badge.criteria as any;

        switch (criteria.type) {
            case 'profile':
                if (checkProfileBadge(badge, userProfile)) earned = true;
                break;
            case 'experience':
                if (await checkExperienceBadge(badge, userId, supabase)) earned = true;
                break;
            case 'portfolio':
                if (await checkPortfolioBadge(badge, userId, supabase)) earned = true;
                break;
            case 'interest':
                if (await checkInterestBadge(badge, userId, supabase)) earned = true;
                break;
        }

        if (earned) {
            badgesToAward.push(badge.id);
        }
    }

    if (badgesToAward.length > 0) {
        const newEarnedBadges = badgesToAward.map(badgeId => ({
            user_id: userId,
            badge_id: badgeId,
        }));
        
        const { error: insertError } = await supabase.from('user_badges').insert(newEarnedBadges);
        if (insertError) {
            console.error("Error awarding badges:", insertError);
        } else {
            console.log(`Awarded ${badgesToAward.length} new badges to user ${userId}`);
        }
    }
}

// --- Signal Score Calculation ---
export async function calculateSignalScore(userId: string, supabase: any): Promise<number> {
    const SCORE_WEIGHTS = {
        PROFILE_FIELD: 5,
        EXPERIENCE: 10,
        PORTFOLIO_ITEM: 15,
        BADGE: 25,
        MESSAGE_SENT: 1,
        AI_ADVISOR_USED: 2,
    };

    let totalScore = 0;

    // Fetch all data in parallel, now including sent messages
    const [profileData, experiencesCount, portfolioCount, badgesCount, messagesCount, aiUsesCount] = await Promise.all([
        supabase.from('profiles').select('bio, headline').eq('id', userId).single(),
        supabase.from('experiences').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('portfolio_items').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('user_badges').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('messages').select('*', { count: 'exact', head: true }).eq('sender_id', userId),
        supabase.from('activity_feed').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('event_type', 'ai_advisor_used'),
    ]);

    if (profileData.data?.bio) totalScore += SCORE_WEIGHTS.PROFILE_FIELD;
    if (profileData.data?.headline) totalScore += SCORE_WEIGHTS.PROFILE_FIELD;

    totalScore += (experiencesCount.count || 0) * SCORE_WEIGHTS.EXPERIENCE;
    totalScore += (portfolioCount.count || 0) * SCORE_WEIGHTS.PORTFOLIO_ITEM;
    totalScore += (badgesCount.count || 0) * SCORE_WEIGHTS.BADGE;
    totalScore += (messagesCount.count || 0) * SCORE_WEIGHTS.MESSAGE_SENT;
    totalScore += (aiUsesCount.count || 0) * SCORE_WEIGHTS.AI_ADVISOR_USED;

    return totalScore;
}