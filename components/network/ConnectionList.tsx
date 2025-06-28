'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConnectionWithProfile } from '@/app/(main)/network/page';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatUserRole } from '@/lib/utils';
import { Check, X, MessageSquare } from 'lucide-react';

interface ConnectionListProps {
  connections: ConnectionWithProfile[];
  currentUserId: string;
  type: 'incoming' | 'accepted';
}

export default function ConnectionList({ connections, currentUserId, type }: ConnectionListProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const handleUpdateConnection = async (id: number, status: 'accepted' | 'declined') => {
    setLoadingId(id);
    await fetch('/api/connections', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    setLoadingId(null);
    router.refresh();
  };

  if (connections.length === 0) {
    return <p className="text-gray-500">No {type === 'incoming' ? 'new requests' : 'connections'}.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {connections.map(conn => {
        // Determine which profile to display (the one that is NOT the current user)
        const profileToShow = conn.requester_id === currentUserId ? conn.addressee : conn.requester;
        if (!profileToShow) return null;

        return (
          <Card key={conn.id} className="text-center flex flex-col">
            <CardHeader>
              <div className="mx-auto mb-4">
                  <img
                      src={profileToShow.avatar_url || `https://placehold.co/80x80/E2E8F0/4A5568?text=${profileToShow.full_name?.charAt(0)}`}
                      alt={`${profileToShow.full_name}'s avatar`}
                      className="w-20 h-20 rounded-full"
                  />
              </div>
              <CardTitle>{profileToShow.full_name}</CardTitle>
              <CardDescription>{formatUserRole(profileToShow.role)}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-gray-600 truncate">{profileToShow.headline || 'No headline'}</p>
            </CardContent>
            <CardFooter>
              {type === 'incoming' && (
                <div className="w-full flex space-x-2">
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => handleUpdateConnection(conn.id, 'declined')}
                    disabled={loadingId === conn.id}
                  >
                    <X className="mr-2 h-4 w-4" /> Decline
                  </Button>
                  <Button 
                    className="w-full" 
                    onClick={() => handleUpdateConnection(conn.id, 'accepted')}
                    disabled={loadingId === conn.id}
                  >
                    <Check className="mr-2 h-4 w-4" /> Accept
                  </Button>
                </div>
              )}
              {type === 'accepted' && (
                <Button variant="outline" className="w-full" onClick={() => router.push('/messages')}>
                  <MessageSquare className="mr-2 h-4 w-4" /> Message
                </Button>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
