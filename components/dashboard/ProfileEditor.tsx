'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import type { Database } from '@/lib/database.types';
import { ChevronDown } from 'lucide-react';

type Profile = Database['public']['Tables']['profiles']['Row'];
type UserRole = Database['public']['Enums']['user_role'];
type Interest = Database['public']['Tables']['interests']['Row'];

interface ProfileEditorProps {
  profile: Profile;
  allInterests: Interest[];
  userInterestIds: number[];
}

function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select..."
}: {
  options: { value: number; label: string }[];
  selected: number[];
  onChange: (selected: number[]) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabels = options
    .filter(op => selected.includes(op.value))
    .map(op => op.label);

  const handleSelect = (value: number) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">
          {selectedLabels.length > 0 ? selectedLabels.join(', ') : placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow-lg max-h-60 overflow-y-auto">
          {options.map(option => (
            <div
              key={option.value}
              className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSelect(option.value)}
            >
              <input
                type="checkbox"
                checked={selected.includes(option.value)}
                readOnly
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-2"
              />
              <span>{option.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProfileEditor({ profile, allInterests, userInterestIds }: ProfileEditorProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(profile.full_name || '');
  const [username, setUsername] = useState(profile.username || '');
  const [headline, setHeadline] = useState(profile.headline || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [role, setRole] = useState<UserRole>(profile.role);
  const [selectedInterests, setSelectedInterests] = useState<number[]>(userInterestIds);
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
        role: role,
        interest_ids: selectedInterests,
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

  const interestOptions = allInterests.map(i => ({ value: i.id, label: i.name }));

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
        <label htmlFor="role" className="font-medium">My Role</label>
        <select id="role" value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
            <option value="high_school_student">High School Student</option>
            <option value="college_student">College Student</option>
            <option value="job_seeker">Job Seeker</option>
            <option value="college_recruiter">College Administrator</option>
            <option value="corporate_recruiter">Corporate Talent Seeker</option>
        </select>
      </div>

      <div className="space-y-1">
          <label htmlFor="interests" className="font-medium">Fields of Interest</label>
          <p className="text-sm text-gray-500">Select one or more fields you work in or are interested in.</p>
          <MultiSelect
              options={interestOptions}
              selected={selectedInterests}
              onChange={setSelectedInterests}
              placeholder="Select your interests..."
          />
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