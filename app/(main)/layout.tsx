import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Home, User, Briefcase, Users, MessageSquare, LogOut, FileText, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { formatUserRole } from '@/lib/utils';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  // FIX: Use getUser() for a secure, server-validated session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select(`full_name, role, avatar_url`)
    .eq('id', user.id)
    .single();

  const navLinks = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/profile', icon: User, label: 'Profile' },
    { href: '/experiences', icon: Briefcase, label: 'Experiences' },
    { href: '/portfolio', icon: FileText, label: 'Portfolio' },
    { href: '/opportunities', icon: Briefcase, label: 'Opportunities' },
    { href: '/network', icon: Users, label: 'Network' },
    { href: '/messages', icon: MessageSquare, label: 'Messages' },
    { href: '/advisor', icon: Sparkles, label: 'AI Advisor' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col">
        <div className="h-16 flex items-center justify-center border-b border-gray-200 px-4">
          <Link href="/dashboard">
            <Logo />
          </Link>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              <link.icon className="w-5 h-5 mr-3" />
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
            <form action="/api/auth/logout" method="post">
                <Button variant="ghost" className="w-full justify-start">
                    <LogOut className="w-5 h-5 mr-3" />
                    Logout
                </Button>
            </form>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-6">
          <div className="flex items-center">
            <div className="text-right mr-4">
              <p className="font-semibold text-gray-800">{profile?.full_name || 'User'}</p>
              <p className="text-sm text-gray-500">{formatUserRole(profile?.role)}</p>
            </div>
            <img
              src={profile?.avatar_url || `https://placehold.co/40x40/E2E8F0/4A5568?text=${profile?.full_name?.charAt(0) || 'U'}`}
              alt="User Avatar"
              className="w-10 h-10 rounded-full"
            />
          </div>
        </header>
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}