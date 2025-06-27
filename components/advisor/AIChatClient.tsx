'use client';

import { useState } from 'react';
import { FullUserProfile } from '@/app/(main)/advisor/page';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Send, User, Bot, Loader } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIChatClient({ userProfile }: { userProfile: FullUserProfile }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const constructPrompt = (userQuery: string): string => {
    let prompt = `You are an expert Career and College Advisor. A student has provided their profile and is asking for advice.

    **Student's Profile:**
    - **Name:** ${userProfile.profile.full_name}
    - **Headline:** ${userProfile.profile.headline}
    - **Bio:** ${userProfile.profile.bio}
    - **Role:** ${userProfile.profile.role}

    **Interests:**
    ${userProfile.interests.map(i => `- ${i.name}`).join('\n') || 'No interests listed.'}

    **Experiences:**
    ${userProfile.experiences.map(e => `- ${e.title} at ${e.organization} (${e.type})`).join('\n') || 'No experiences listed.'}

    **Courses:**
    ${userProfile.courses.map(c => `- ${c.course_name}`).join('\n') || 'No courses listed.'}

    ---

    Based on this complete profile, please provide a thoughtful, encouraging, and actionable response to the student's question. Be specific and try to connect your advice directly to their listed experiences and interests.

    **Student's Question:** "${userQuery}"
    `;
    return prompt;
  };

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setInput('');

    const fullPrompt = constructPrompt(input);
    
    // --- Gemini API Call ---
    try {
      // NOTE: This is an insecure way to call the API from the client.
      // For a real production app, you would create an API route in Next.js
      // that calls the Gemini API from the server, protecting your key.
      // This client-side approach is for demonstration purposes.
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY; 
      if (!apiKey) {
          throw new Error("API Key not found. Please add NEXT_PUBLIC_GEMINI_API_KEY to your environment variables.");
      }

      const payload = {
          contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      };
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.candidates && result.candidates.length > 0) {
        const text = result.candidates[0].content.parts[0].text;
        const assistantMessage: ChatMessage = { role: 'assistant', content: text };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('No content received from AI.');
      }

    } catch (error) {
      console.error("Error calling Gemini API:", error);
      const errorMessageText = error instanceof Error ? error.message : "Sorry, I couldn't get a response. Please try again later.";
      const errorMessage: ChatMessage = { role: 'assistant', content: errorMessageText };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border h-[70vh] flex flex-col">
      {/* Message Display Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="p-2 bg-amber-500 text-white rounded-full">
                <Bot size={20} />
              </div>
            )}
            <div className={`max-w-xl p-4 rounded-lg ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>
              <p style={{whiteSpace: 'pre-wrap'}}>{msg.content}</p>
            </div>
             {msg.role === 'user' && (
              <div className="p-2 bg-blue-500 text-white rounded-full">
                <User size={20} />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
            <div className="flex items-start gap-4">
                <div className="p-2 bg-amber-500 text-white rounded-full">
                    <Bot size={20} />
                </div>
                <div className="max-w-xl p-4 rounded-lg bg-gray-100 flex items-center">
                    <Loader className="animate-spin" />
                </div>
            </div>
        )}
      </div>

      {/* Input Form */}
      <div className="p-4 bg-white border-t">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <Input 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            placeholder="Ask for advice..." 
            autoComplete="off"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading}>
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
