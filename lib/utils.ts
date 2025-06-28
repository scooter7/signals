import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Database } from "./database.types";

type UserRole = Database['public']['Enums']['user_role'];

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatUserRole(role: UserRole | null | undefined): string {
    if (!role) return 'Member';
    
    // The switch statement covers all possible cases for the UserRole type.
    // The 'default' case was removed because TypeScript correctly identified it as unreachable.
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
