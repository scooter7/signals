'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ConnectionWithProfile } from '@/app/(main)/messages/page';
import { Database } from '@/lib/database.types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Send } from 'lucide-react';

type Message = Database['public']['Tables']['messages']['Row'];

export default function MessagingClient({ connections, currentUserId }: { connections: ConnectionWithProfile[], currentUserId: string }) {
  const supabase = createClient();
  const [selectedConnection, setSelectedConnection] = useState<ConnectionWithProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  // Use a ref to hold the current selected connection. This allows the subscription
  // callback to access the latest value without being part of the useEffect dependency array.
  const selectedConnectionRef = useRef<ConnectionWithProfile | null>(null);
  selectedConnectionRef.current = selectedConnection;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Effect to fetch messages when a conversation is selected
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConnection) {
        setMessages([]); // Clear messages when no conversation is selected
        return;
      }

      const otherUserId = selectedConnection.profile.id;
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
      } else {
        setMessages(data || []);
      }
    };
    fetchMessages();
  }, [selectedConnection, currentUserId, supabase]);
  
  // --- REVISED Real-time message subscription ---
  // This useEffect runs only ONCE when the component mounts.
  useEffect(() => {
    const channel = supabase
      .channel(`realtime-messages-for-${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUserId}`,
        },
        (payload) => {
          const newMessagePayload = payload.new as Message;
          
          // Check if the incoming message belongs to the currently active chat window.
          // We use the ref here to get the most up-to-date value of the selected connection.
          if (selectedConnectionRef.current && newMessagePayload.sender_id === selectedConnectionRef.current.profile.id) {
            setMessages((prevMessages) => [...prevMessages, newMessagePayload]);
          } else {
            // Optional: If the message is for another chat, you could show a notification.
            console.log('Received a message for a different conversation.');
          }
        }
      )
      .subscribe();

    // Cleanup function to remove the channel when the component unmounts.
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, currentUserId]); // This dependency array is stable and won't cause re-subscriptions.

  // Scroll to bottom whenever the messages array changes.
  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConnection) return;

    const optimisticMessage: Message = {
        id: Date.now(),
        sender_id: currentUserId,
        receiver_id: selectedConnection.profile.id,
        content: newMessage.trim(),
        file_url: null,
        is_read: false,
        created_at: new Date().toISOString(),
    };

    setMessages(prevMessages => [...prevMessages, optimisticMessage]);
    setNewMessage('');

    const { error } = await supabase.from('messages').insert({
      sender_id: currentUserId,
      receiver_id: selectedConnection.profile.id,
      content: optimisticMessage.content,
    });

    if (error) {
      console.error('Error sending message:', error);
      setMessages(prevMessages => prevMessages.filter(m => m.id !== optimisticMessage.id));
      alert("Failed to send message. Please try again.");
      setNewMessage(optimisticMessage.content || '');
    }
  };

  return (
    <div className="flex h-full border rounded-lg bg-white shadow-sm">
      {/* Conversation List */}
      <aside className="w-1/3 border-r">
        <div className="p-4 border-b">
            <h2 className="font-semibold text-lg">Conversations</h2>
        </div>
        <div className="overflow-y-auto">
          {connections.map(conn => (
            <div
              key={conn.id}
              onClick={() => setSelectedConnection(conn)}
              className={`p-4 flex items-center cursor-pointer hover:bg-gray-100 ${selectedConnection?.id === conn.id ? 'bg-blue-100' : ''}`}
            >
              <img src={conn.profile.avatar_url || `https://placehold.co/40x40/E2E8F0/4A5568?text=${conn.profile.full_name?.charAt(0)}`} alt="avatar" className="w-10 h-10 rounded-full mr-3" />
              <div>
                <p className="font-semibold">{conn.profile.full_name}</p>
                <p className="text-sm text-gray-600 truncate">{conn.profile.headline}</p>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Chat Window */}
      <main className="w-2/3 flex flex-col">
        {selectedConnection ? (
          <>
            <div className="p-4 border-b flex items-center">
                <img src={selectedConnection.profile.avatar_url || `https://placehold.co/40x40/E2E8F0/4A5568?text=${selectedConnection.profile.full_name?.charAt(0)}`} alt="avatar" className="w-10 h-10 rounded-full mr-3" />
                <h2 className="font-semibold text-lg">{selectedConnection.profile.full_name}</h2>
            </div>
            <div className="flex-grow p-4 overflow-y-auto bg-gray-50">
              {messages.map(msg => (
                <div key={msg.id} className={`flex mb-4 ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}>
                  <div className={`rounded-lg px-4 py-2 max-w-sm ${msg.sender_id === currentUserId ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 bg-white border-t">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." autoComplete="off" />
                <Button type="submit" size="icon">
                  <Send className="h-5 w-5" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </main>
    </div>
  );
}