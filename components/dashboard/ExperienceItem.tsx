'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Experience } from '@/app/(main)/experiences/page';
import { format } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { Edit, Trash2 } from 'lucide-react';
import ExperienceForm from './ExperienceForm';
import { Database } from '@/lib/database.types';

type Interest = Database['public']['Tables']['interests']['Row'];

export default function ExperienceItem({ experience, interests }: { experience: Experience, interests: Interest[] }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this experience?')) {
      return;
    }

    const response = await fetch('/api/experiences', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: experience.id }),
    });

    if (response.ok) {
      router.refresh();
    } else {
      alert('Failed to delete experience.');
    }
  };

  const category = interests.find(i => i.id === experience.interest_id)?.name;

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
      {isEditing ? (
        <ExperienceForm 
          experienceToEdit={experience} 
          onFormSubmit={() => setIsEditing(false)} 
          interests={interests}
        />
      ) : (
        <div>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg">{experience.title}</h3>
              <p className="text-md text-gray-700">{experience.organization}</p>
              <p className="text-sm text-gray-500">
                {format(new Date(experience.start_date), 'MMM yyyy')} -
                {experience.is_current ? ' Present' : experience.end_date ? ` ${format(new Date(experience.end_date), 'MMM yyyy')}` : ''}
              </p>
              {category && <p className="text-sm font-medium text-indigo-600 mt-1">{category}</p>}
              {experience.description && <p className="mt-2 text-gray-600">{experience.description}</p>}
            </div>
            <div className="flex space-x-2">
              <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
