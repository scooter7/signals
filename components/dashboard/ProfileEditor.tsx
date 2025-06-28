'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import type { Database } from '@/lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type UserRole = Database['public']['Enums']['user_role'];

export default function ProfileEditor({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [fullName, setFullName] = useState(profile.full_name || '');
  const [username, setUsername] = useState(profile.username || '');
  const [headline, setHeadline] = useState(profile.headline || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [role, setRole] = useState<UserRole>(profile.role); // <-- Add state for role
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const response = await fetch('/api/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        full_name: fullName,
        username: username,
        headline: headline,
        bio: bio,
        role: role, // <-- Send the updated role to the API
      }),
    });

    setIsSubmitting(false);

    if (response.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        router.refresh();
    } else {
        const { error } = await response.json();
        setMessage({ type: 'error', text: error || 'An unexpected error occurred.' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
        {message && (
            <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {message.text}
            </div>
        )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <label htmlFor="fullName" className="font-medium">Full Name</label>
          <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label htmlFor="username" className="font-medium">Username</label>
          <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
      </div>
      
      {/* Add the Role dropdown */}
      <div className="space-y-1">
        <label htmlFor="role" className="font-medium">My Role</label>
        <select id="role" value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
            <option value="high_school_student">High School Student</option>
            <option value="college_student">College Student</option>
            <option value="college_recruiter">College Administrator</option>
            <option value="corporate_recruiter">Corporate Talent Seeker</option>
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="headline" className="font-medium">Headline</label>
        <p className="text-sm text-gray-500">A short, one-line summary (e.g., "Aspiring Software Engineer" or "Biology Major at State University").</p>
        <Input id="headline" value={headline} onChange={(e) => setHeadline(e.target.value)} />
      </div>

      <div className="space-y-1">
        <label htmlFor="bio" className="font-medium">Bio</label>
        <p className="text-sm text-gray-500">Tell us more about your goals, interests, and what you're passionate about.</p>
        <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={5} />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
