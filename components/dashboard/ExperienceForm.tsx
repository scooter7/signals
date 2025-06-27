'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Database } from '@/lib/database.types';
import { Experience } from '@/app/(main)/experiences/page';

type ExperienceType = Database['public']['Enums']['experience_type'];

interface ExperienceFormProps {
  experienceToEdit?: Experience;
  onFormSubmit?: () => void; // Callback to close the form after editing
}

export default function ExperienceForm({ experienceToEdit, onFormSubmit }: ExperienceFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ExperienceType>('academic');
  const [organization, setOrganization] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCurrent, setIsCurrent] = useState(false);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!experienceToEdit;

  useEffect(() => {
    if (isEditMode) {
      setTitle(experienceToEdit.title);
      setType(experienceToEdit.type);
      setOrganization(experienceToEdit.organization || '');
      setStartDate(experienceToEdit.start_date.split('T')[0]); // Format date for input
      setEndDate(experienceToEdit.end_date ? experienceToEdit.end_date.split('T')[0] : '');
      setIsCurrent(experienceToEdit.is_current || false);
      setDescription(experienceToEdit.description || '');
    }
  }, [experienceToEdit, isEditMode]);

  const resetForm = () => {
    setTitle('');
    setType('academic');
    setOrganization('');
    setStartDate('');
    setEndDate('');
    setIsCurrent(false);
    setDescription('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const url = isEditMode ? '/api/experiences' : '/api/experiences';
    const method = isEditMode ? 'PATCH' : 'POST';

    const body = {
      id: isEditMode ? experienceToEdit.id : undefined,
      title,
      type,
      organization,
      start_date: startDate,
      end_date: isCurrent ? null : endDate,
      is_current: isCurrent,
      description
    };

    const response = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    setIsSubmitting(false);

    if (response.ok) {
      if (isEditMode && onFormSubmit) {
        onFormSubmit(); // Close the edit form
      } else {
        resetForm(); // Reset the 'add new' form
      }
      router.refresh(); // Refresh page data
    } else {
      const { error } = await response.json();
      setError(error || `Failed to ${isEditMode ? 'update' : 'add'} experience.`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500 text-sm bg-red-100 p-2 rounded-md">{error}</p>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">Title *</label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="type" className="block text-sm font-medium mb-1">Type *</label>
          <select id="type" value={type} onChange={(e) => setType(e.target.value as ExperienceType)} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
            <option value="academic">Academic</option>
            <option value="extracurricular">Extracurricular</option>
            <option value="internship">Internship</option>
            <option value="work">Work</option>
            <option value="project">Project</option>
            <option value="volunteer">Volunteer</option>
          </select>
        </div>
      </div>
      
      <div>
        <label htmlFor="organization" className="block text-sm font-medium mb-1">Organization / School</label>
        <Input id="organization" value={organization} onChange={(e) => setOrganization(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium mb-1">Start Date *</label>
          <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium mb-1">End Date</label>
          <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={isCurrent} />
        </div>
      </div>
      
      <div className="flex items-center">
        <input id="isCurrent" type="checkbox" checked={isCurrent} onChange={(e) => setIsCurrent(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
        <label htmlFor="isCurrent" className="ml-2 block text-sm text-gray-900">I currently work / participate here</label>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      
      <div className="flex justify-end space-x-2">
        {isEditMode && (
            <Button type="button" variant="ghost" onClick={onFormSubmit}>Cancel</Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Save Experience'}
        </Button>
      </div>
    </form>
  );
}