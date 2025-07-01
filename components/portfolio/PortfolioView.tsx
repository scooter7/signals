'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PortfolioItem } from '@/app/(main)/portfolio/page';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { PlusCircle, Trash2, ExternalLink } from 'lucide-react';
import { Database } from '@/lib/database.types';

type Interest = Database['public']['Tables']['interests']['Row'];

interface PortfolioViewProps {
  initialItems: PortfolioItem[];
  interests: Interest[];
}

export default function PortfolioView({ initialItems, interests }: PortfolioViewProps) {
  const router = useRouter();
  const [items, setItems] = useState<PortfolioItem[]>(initialItems);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [interestId, setInterestId] = useState<number | null>(null); // New state for category
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const response = await fetch('/api/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, link_url: linkUrl, interest_id: interestId }),
    });

    if (response.ok) {
      setTitle('');
      setDescription('');
      setLinkUrl('');
      setInterestId(null);
      setShowForm(false);
      router.refresh();
    } else {
      const { error } = await response.json();
      setError(error || 'Failed to add item.');
    }
    setIsSubmitting(false);
  };
  
  const handleDeleteItem = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
        return;
    }

    const response = await fetch('/api/portfolio', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
    });

    if (response.ok) {
        setItems(items.filter(item => item.id !== id));
        router.refresh();
    } else {
        alert('Failed to delete item.');
    }
  };


  return (
    <div>
      {!showForm && (
        <div className="mb-6">
          <Button onClick={() => setShowForm(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Item
          </Button>
        </div>
      )}

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add a New Portfolio Item</CardTitle>
          </CardHeader>
          <form onSubmit={handleAddItem}>
            <CardContent className="space-y-4">
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div>
                <label htmlFor="title" className="block text-sm font-medium mb-1">Title *</label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div>
                <label htmlFor="interest" className="block text-sm font-medium mb-1">Category</label>
                <select 
                  id="interest" 
                  value={interestId || ''} 
                  onChange={(e) => setInterestId(e.target.value ? parseInt(e.target.value) : null)} 
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select a Category --</option>
                  {interests.map(interest => (
                    <option key={interest.id} value={interest.id}>{interest.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div>
                <label htmlFor="linkUrl" className="block text-sm font-medium mb-1">Link URL</label>
                <Input id="linkUrl" type="url" placeholder="https://github.com/user/project" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button variant="ghost" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add Item'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <Card key={item.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
              {item.description && <CardDescription>{item.description}</CardDescription>}
            </CardHeader>
            <CardContent className="flex-grow">
              {/* Future content like thumbnails can go here */}
            </CardContent>
            <CardFooter className="justify-between">
              {item.link_url ? (
                <a href={item.link_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center">
                  View Project <ExternalLink className="ml-1 h-4 w-4" />
                </a>
              ) : <div />}
              <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      {items.length === 0 && !showForm && (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <p className="text-gray-500">Your portfolio is empty.</p>
            <p className="text-gray-500">Click "Add New Item" to get started.</p>
        </div>
      )}
    </div>
  );
}
