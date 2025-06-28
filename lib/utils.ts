import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Database } from "./database.types";

type UserRole = Database['public']['Enums']['user_role'];

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// NEW FUNCTION: Formats the role enum for display
export function formatUserRole(role: UserRole | null | undefined): string {
    if (!role) return 'Member'; // A sensible default
    
    switch (role) {
        case 'high_school_student':
            return 'High School Student';
        case 'college_student':
            return 'College Student';
        case 'college_recruiter':
            return 'College Administrator';
        case 'corporate_recruiter':
            return 'Corporate Talent Seeker';
        default:
            return 'Member';
    }
}
