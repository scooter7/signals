'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Profile } from '@/app/(main)/network/page';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { UserPlus, CheckCircle } from 'lucide-react';

export default function UserCard({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [isRequested, setIsRequested] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    const response = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addressee_id: profile.id })
    });
    setIsLoading(false);

    if (response.ok) {
        setIsRequested(true);
        // Optionally, you could remove the card from the UI instead of just disabling the button
        // router.refresh(); 
    } else {
        const { error } = await response.json();
        alert(error || 'Failed to send connection request.');
    }
  };

  return (
    <Card className="text-center flex flex-col">
      <CardHeader>
        <div className="mx-auto mb-4">
            <img
                src={profile.avatar_url || `https://placehold.co/80x80/E2E8F0/4A5568?text=${profile.full_name?.charAt(0) || 'U'}`}
                alt={`${profile.full_name}'s avatar`}
                className="w-20 h-20 rounded-full"
            />
        </div>
        <CardTitle>{profile.full_name}</CardTitle>
        <CardDescription className="capitalize">{profile.role}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-gray-600 truncate">{profile.headline || 'No headline provided.'}</p>
      </CardContent>
      <CardFooter>
        <Button 
            className="w-full" 
            onClick={handleConnect} 
            disabled={isRequested || isLoading}
        >
          {isRequested ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" /> Requested
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" /> Connect
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}