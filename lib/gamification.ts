import { Database } from './database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Badge = Database['public']['Tables']['badges']['Row'];
type UserRole = Database['public']['Enums']['user_role'];
type Experience = Database['public']['Tables']['experiences']['Row'];
type PortfolioItem = Database['public']['Tables']['portfolio_items']['Row'];

// A more specific type for a profile that includes its related data for scoring
type ProfileForScoring = Profile & {
    user_interests: { interest_id: number }[];
    experiences: Pick<Experience, 'interest_id'>[];
    portfolio_items: Pick<PortfolioItem, 'interest_id'>[];
};

// --- Activity Score Calculation ---
export async function calculateActivityScore(userId: string, supabase: any): Promise<number> {
    const SCORE_WEIGHTS = {
        PROFILE_FIELD: 5,
        EXPERIENCE: 10,
        PORTFOLIO_ITEM: 15,
        BADGE: 25,
        MESSAGE_SENT: 1,
        AI_ADVISOR_USED: 2,
    };
    let totalScore = 0;
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

// --- Dynamic Compatibility Score (The New "Signal Score") ---
export function calculateCompatibilityScore(
    currentUser: ProfileForScoring,
    otherUser: ProfileForScoring
): number {
    const COMPATIBILITY_WEIGHTS = {
        ROLE_MATCH: 100,
        SHARED_INTEREST: 25, // A user's stated interest matches another's
        INTEREST_EXPERIENCE_MATCH: 75, // A user's interest matches another's categorized experience/project
    };

    let compatibilityScore = 0;

    // 1. Role compatibility ("Phase of Life")
    const roleA = currentUser.role;
    const roleB = otherUser.role;
    if ((roleA === 'high_school_student' && roleB === 'college_recruiter') || (roleB === 'high_school_student' && roleA === 'college_recruiter')) {
        compatibilityScore += COMPATIBILITY_WEIGHTS.ROLE_MATCH;
    }
    if (( (roleA === 'college_student' || roleA === 'job_seeker') && roleB === 'corporate_recruiter') || ( (roleB === 'college_student' || roleB === 'job_seeker') && roleA === 'corporate_recruiter')) {
        compatibilityScore += COMPATIBILITY_WEIGHTS.ROLE_MATCH;
    }

    // 2. Shared interests and experiences
    const currentUserInterestIds = new Set(currentUser.user_interests.map(i => i.interest_id));
    const otherUserInterestIds = new Set(otherUser.user_interests.map(i => i.interest_id));
    
    const otherUserExperienceIds = new Set(otherUser.experiences.map(e => e.interest_id).filter(Boolean));
    const otherUserPortfolioIds = new Set(otherUser.portfolio_items.map(p => p.interest_id).filter(Boolean));

    // Check for matches between current user's interests and the other user's profile
    for (const interestId of currentUserInterestIds) {
        if (otherUserInterestIds.has(interestId)) {
            compatibilityScore += COMPATIBILITY_WEIGHTS.SHARED_INTEREST;
        }
        if (otherUserExperienceIds.has(interestId)) {
            compatibilityScore += COMPATIBILITY_WEIGHTS.INTEREST_EXPERIENCE_MATCH;
        }
        if (otherUserPortfolioIds.has(interestId)) {
            compatibilityScore += COMPATIBILITY_WEIGHTS.INTEREST_EXPERIENCE_MATCH;
        }
    }

    // Do the same check in reverse
    const currentUserExperienceIds = new Set(currentUser.experiences.map(e => e.interest_id).filter(Boolean));
    const currentUserPortfolioIds = new Set(currentUser.portfolio_items.map(p => p.interest_id).filter(Boolean));

    for (const interestId of otherUserInterestIds) {
        if (currentUserExperienceIds.has(interestId)) {
            compatibilityScore += COMPATIBILITY_WEIGHTS.INTEREST_EXPERIENCE_MATCH;
        }
        if (currentUserPortfolioIds.has(interestId)) {
            compatibilityScore += COMPATIBILITY_WEIGHTS.INTEREST_EXPERIENCE_MATCH;
        }
    }

    return compatibilityScore;
}


// --- Badge Awarding Logic ---
// (This logic remains unchanged but is included for completeness)
const checkProfileBadge = (badge: Badge, profile: Profile): boolean => {
    if (!badge.criteria || typeof badge.criteria !== 'object' || !('fields' in badge.criteria)) return false;
    const requiredFields = badge.criteria.fields as string[];
    return requiredFields.every(field => profile[field as keyof Profile]);
};
const checkExperienceBadge = async (badge: Badge, userId: string, supabase: any): Promise<boolean> => {
    if (!badge.criteria || typeof badge.criteria !== 'object' || !('count' in badge.criteria)) return false;
    const requiredCount = badge.criteria.count as number;
    const { count, error } = await supabase.from('experiences').select('*', { count: 'exact', head: true }).eq('user_id', userId);
    if (error) return false;
    return count >= requiredCount;
};
const checkPortfolioBadge = async (badge: Badge, userId: string, supabase: any): Promise<boolean> => {
    if (!badge.criteria || typeof badge.criteria !== 'object' || !('count' in badge.criteria)) return false;
    const requiredCount = badge.criteria.count as number;
    const { count, error } = await supabase.from('portfolio_items').select('*', { count: 'exact', head: true }).eq('user_id', userId);
    if (error) return false;
    return count >= requiredCount;
};
const checkInterestBadge = async (badge: Badge, userId:string, supabase: any): Promise<boolean> => {
    if (!badge.criteria || typeof badge.criteria !== 'object' || !('count' in badge.criteria)) return false;
    const requiredCount = badge.criteria.count as number;
    const { count, error } = await supabase.from('user_interests').select('*', { count: 'exact', head: true }).eq('user_id', userId);
    if (error) return false;
    return count >= requiredCount;
};
export async function checkAndAwardBadges(userId: string, supabase: any) {
    const { data: allBadges, error: badgesError } = await supabase.from('badges').select('*');
    const { data: userProfile, error: profileError } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (badgesError || profileError || !allBadges || !userProfile) {
        console.error("Error fetching data for badge check:", badgesError || profileError);
        return;
    }
    const { data: earnedBadges, error: earnedError } = await supabase.from('user_badges').select('badge_id').eq('user_id', userId);
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
            case 'profile': if (checkProfileBadge(badge, userProfile)) earned = true; break;
            case 'experience': if (await checkExperienceBadge(badge, userId, supabase)) earned = true; break;
            case 'portfolio': if (await checkPortfolioBadge(badge, userId, supabase)) earned = true; break;
            case 'interest': if (await checkInterestBadge(badge, userId, supabase)) earned = true; break;
        }
        if (earned) badgesToAward.push(badge.id);
    }
    if (badgesToAward.length > 0) {
        const newEarnedBadges = badgesToAward.map(badgeId => ({ user_id: userId, badge_id: badgeId }));
        const { error: insertError } = await supabase.from('user_badges').insert(newEarnedBadges);
        if (insertError) console.error("Error awarding badges:", insertError);
        else console.log(`Awarded ${badgesToAward.length} new badges to user ${userId}`);
    }
}
