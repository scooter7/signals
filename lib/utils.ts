import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Database } from "./database.types";

type UserRole = Database['public']['Enums']['user_role'];

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatUserRole(role: UserRole | null | undefined): string {
    if (!role) return 'Member';
    
    switch (role) {
        case 'high_school_student':
            return 'High School Student';
        case 'college_student':
            return 'College Student';
        case 'job_seeker':
            return 'Job Seeker';
        case 'college_recruiter':
            return 'College Administrator';
        case 'corporate_recruiter':
            return 'Corporate Talent Seeker';
    }
}

/**
 * Converts a numeric compatibility score into a qualitative rating.
 * @param score The numeric score calculated from compatibility and activity.
 * @returns An object with a label ('Low', 'Medium', 'High') and a Tailwind CSS color class.
 */
export function getSignalStrength(score: number): { label: string; color: string } {
  // Scores below 100 are typically users with little in common.
  if (score < 100) {
    return { label: 'Low Signal', color: 'text-gray-500' };
  }
  // Scores from 100-199 indicate a good potential match (e.g., role match or multiple shared interests).
  if (score >= 100 && score < 200) {
    return { label: 'Medium Signal', color: 'text-yellow-600' };
  }
  // Scores 200+ indicate a strong match (e.g., role match AND shared interests).
  return { label: 'High Signal', color: 'text-green-600' };
}
