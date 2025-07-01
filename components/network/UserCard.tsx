'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProfileWithInterests } from '@/app/(main)/network/page'; // Import the specific type
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { UserPlus, CheckCircle, Zap } from 'lucide-react';
import { formatUserRole } from '@/lib/utils';

// Update the props to use the more detailed ProfileWithInterests type
export default function UserCard({ profile }: { profile: ProfileWithInterests }) {
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
    } else {
        const { error } = await response.json();
        alert(error || 'Failed to send connection request.');
    }
  };

  return (
    <Card className="text-center flex flex-col border shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pt-6 pb-2">
        <div className="mx-auto mb-4">
            <img
                src={profile.avatar_url || `https://placehold.co/80x80/E2E8F0/4A5568?text=${profile.full_name?.charAt(0) || 'U'}`}
                alt={`${profile.full_name}'s avatar`}
                className="w-20 h-20 rounded-full"
            />
        </div>
        <CardTitle>{profile.full_name}</CardTitle>
        <CardDescription>{formatUserRole(profile.role)}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow px-4 pb-4">
         {/* Display the new Signal Score */}
        <div 
          className="flex items-center justify-center gap-2 mb-2 text-purple-600 font-semibold"
          title="This Signal Score represents your compatibility based on shared interests, roles, and overall activity."
        >
            <Zap size={16} className="text-purple-500" />
            <span>{Math.round(profile.compatibility_score || 0)} Signal</span>
        </div>
        <p className="text-sm text-gray-600 truncate px-2">{profile.headline || 'No headline provided.'}</p>
      </CardContent>
      <CardFooter className="p-4">
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
