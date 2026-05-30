'use client';

import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../lib/api';
import Link from 'next/link';
import { Lock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function RegisterPage() {
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/register', { 
        name, 
        email, 
        password,
        role: 'BORROWER' // registration form is strictly for Borrowers
      });
      const { token, user } = response.data;
      toast.success(`Account created successfully! Welcome, ${user.name}.`);
      login(token, user);
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.error || 'Registration failed. Check network or try another email.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-zinc-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-zinc-900 text-white p-2 rounded">
            <Lock className="h-6 w-6" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-xl font-bold tracking-tight text-zinc-900">
          Create Borrower Account
        </h2>
        <p className="mt-2 text-center text-xs text-zinc-500">
          Get started with your loan application profile.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 border border-zinc-200 shadow-sm sm:px-10">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 p-3 text-red-700 text-xs flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-zinc-700">
                Full Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-sm border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-900"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-zinc-700">
                Email Address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-sm border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-900"
                  placeholder="john@example.com"
                  suppressHydrationWarning
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-zinc-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-sm border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-900"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-zinc-900 text-white text-xs font-semibold uppercase tracking-wider py-2.5 hover:bg-zinc-800 disabled:opacity-50 transition"
              >
                {loading ? 'Registering...' : 'Register'}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-zinc-200 pt-4 text-center">
            <p className="text-xs text-zinc-500">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-zinc-950 underline hover:text-zinc-800">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
