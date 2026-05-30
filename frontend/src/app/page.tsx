'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Loader } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        if (user.role === 'BORROWER') {
          router.push('/portal');
        } else {
          router.push('/dashboard');
        }
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 text-zinc-950 font-sans">
      <div className="flex flex-col items-center space-y-2">
        <Loader className="h-5 w-5 animate-spin text-zinc-600" />
        <span className="text-xs font-mono text-zinc-500">Redirecting to session portal...</span>
      </div>
    </div>
  );
}
