import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { Database } from './database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Badge = Database['public']['Tables']['badges']['Row'];

// Helper function to check if a user's profile meets badge criteria
const checkProfileBadge = (badge: Badge, profile: Profile): boolean => {
    if (!badge.criteria || typeof badge.criteria !== 'object' || !('fields' in badge.criteria)) {
        return false;
    }
    const requiredFields = badge.criteria.fields as string[];
    // Check if all required fields in the badge criteria exist and are not empty on the user's profile
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
const checkInterestBadge = async (badge: Badge, userId: string, supabase: any): Promise<boolean> => {
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
export async function checkAndAwardBadges(userId: string) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // 1. Get all available badges and the user's current profile data
    const { data: allBadges, error: badgesError } = await supabase.from('badges').select('*');
    const { data: userProfile, error: profileError } = await supabase.from('profiles').select('*').eq('id', userId).single();
    
    if (badgesError || profileError || !allBadges || !userProfile) {
        console.error("Error fetching data for badge check:", badgesError || profileError);
        return;
    }

    // 2. Get the badges the user has already earned
    const { data: earnedBadges, error: earnedError } = await supabase
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', userId);

    if (earnedError) {
        console.error("Error fetching earned badges:", earnedError);
        return;
    }
    const earnedBadgeIds = new Set(earnedBadges.map(b => b.badge_id));

    // 3. Determine which badges to check (those not yet earned)
    const badgesToCheck = allBadges.filter(badge => !earnedBadgeIds.has(badge.id));
    const badgesToAward: number[] = [];

    // 4. Loop through and check criteria for each unearned badge
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

    // 5. Award the new badges
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

export async function calculateAndUpdateSignalScore(userId: string) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Define the points for each item
    const SCORE_WEIGHTS = {
        PROFILE_FIELD: 5,   // e.g., for having a bio, headline
        EXPERIENCE: 10,     // per experience
        PORTFOLIO_ITEM: 15, // per portfolio item
        BADGE: 25,          // per badge earned
    };

    let totalScore = 0;

    // 1. Fetch all necessary user data in parallel
    const [profileData, experiencesCount, portfolioCount, badgesCount] = await Promise.all([
        supabase.from('profiles').select('bio, headline').eq('id', userId).single(),
        supabase.from('experiences').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('portfolio_items').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('user_badges').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    ]);

    // 2. Calculate score from profile completeness
    if (profileData.data?.bio) totalScore += SCORE_WEIGHTS.PROFILE_FIELD;
    if (profileData.data?.headline) totalScore += SCORE_WEIGHTS.PROFILE_FIELD;

    // 3. Calculate score from counts
    totalScore += (experiencesCount.count || 0) * SCORE_WEIGHTS.EXPERIENCE;
    totalScore += (portfolioCount.count || 0) * SCORE_WEIGHTS.PORTFOLIO_ITEM;
    totalScore += (badgesCount.count || 0) * SCORE_WEIGHTS.BADGE;

    // 4. Update the score in the database
    const { error } = await supabase
        .from('profiles')
        .update({ signal_score: totalScore })
        .eq('id', userId);

    if (error) {
        console.error("Error updating signal score:", error);
    } else {
        console.log(`Updated signal score for user ${userId} to ${totalScore}`);
    }
}
