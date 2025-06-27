'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import type { Database } from '@/lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function ProfileEditor({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [fullName, setFullName] = useState(profile.full_name || '');
  const [username, setUsername] = useState(profile.username || '');
  const [headline, setHeadline] = useState(profile.headline || '');
  const [bio, setBio] = useState(profile.bio || '');
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
      }),
    });

    setIsSubmitting(false);

    if (response.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        // Refresh the page to show server-rendered updates
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
