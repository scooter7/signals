'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Database } from '@/lib/database.types';

type OpportunityType = Database['public']['Enums']['opportunity_type'];

export default function OpportunityForm({ companyName }: { companyName: string }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<OpportunityType>('internship');
  const [location, setLocation] = useState('');
  const [applicationUrl, setApplicationUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const response = await fetch('/api/opportunities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        type,
        company_name: companyName,
        location,
        application_url: applicationUrl,
        description,
      }),
    });

    setIsSubmitting(false);

    if (response.ok) {
      // Reset form and refresh page
      setTitle('');
      setType('internship');
      setLocation('');
      setApplicationUrl('');
      setDescription('');
      router.refresh();
    } else {
      const { error: apiError } = await response.json();
      setError(apiError || 'Failed to post opportunity. You may not have the required permissions.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500 text-sm bg-red-100 p-2 rounded-md">{error}</p>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="opp-title" className="block text-sm font-medium mb-1">Title *</label>
          <Input id="opp-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="opp-type" className="block text-sm font-medium mb-1">Type *</label>
          <select id="opp-type" value={type} onChange={(e) => setType(e.target.value as OpportunityType)} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
            <option value="internship">Internship</option>
            <option value="full-time">Full-Time Job</option>
            <option value="part-time">Part-Time Job</option>
            <option value="scholarship">Scholarship</option>
            <option value="program">Academic Program</option>
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="opp-location" className="block text-sm font-medium mb-1">Location</label>
          <Input id="opp-location" placeholder="e.g., Remote or New York, NY" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <div>
          <label htmlFor="opp-url" className="block text-sm font-medium mb-1">Application URL</label>
          <Input id="opp-url" type="url" value={applicationUrl} onChange={(e) => setApplicationUrl(e.target.value)} />
        </div>
      </div>

      <div>
        <label htmlFor="opp-description" className="block text-sm font-medium mb-1">Description *</label>
        <Textarea id="opp-description" value={description} onChange={(e) => setDescription(e.target.value)} required />
      </div>
      
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Posting...' : 'Post Opportunity'}
        </Button>
      </div>
    </form>
  );
}
