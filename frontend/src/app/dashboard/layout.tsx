'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Users, 
  CheckSquare, 
  CreditCard, 
  DollarSign, 
  LogOut, 
  ShieldCheck,
  Menu,
  X
} from 'lucide-react';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  allowedRoles: string[];
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems: SidebarItem[] = [
    {
      name: 'Sales Leads',
      href: '/dashboard/sales',
      icon: Users,
      allowedRoles: ['SALES', 'ADMIN'],
    },
    {
      name: 'Sanctioning',
      href: '/dashboard/sanction',
      icon: CheckSquare,
      allowedRoles: ['SANCTION', 'ADMIN'],
    },
    {
      name: 'Disbursement',
      href: '/dashboard/disbursement',
      icon: CreditCard,
      allowedRoles: ['DISBURSEMENT', 'ADMIN'],
    },
    {
      name: 'Collection',
      href: '/dashboard/collection',
      icon: DollarSign,
      allowedRoles: ['COLLECTION', 'ADMIN'],
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center space-y-2">
          <div className="h-5 w-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-mono text-zinc-500">Authenticating session...</span>
        </div>
      </div>
    );
  }

  // Filter items borrower can access
  const filteredNavItems = navItems.filter(item => 
    user && item.allowedRoles.includes(user.role)
  );

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col md:flex-row text-zinc-900">
      {/* Mobile Header Bar */}
      <header className="md:hidden flex items-center justify-between bg-white px-4 py-3 border-b border-zinc-200">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="h-5 w-5 text-zinc-900" />
          <span className="font-semibold tracking-tight text-sm">LMS Ops</span>
        </div>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-zinc-600 focus:outline-none p-1 border border-zinc-200 bg-zinc-50 rounded"
        >
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-20 w-64 bg-zinc-950 border-r border-zinc-850 flex flex-col transform md:translate-x-0 transition-transform duration-200 ease-in-out md:static
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Brand Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-zinc-800 text-zinc-100 p-1 rounded border border-zinc-700">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span className="font-bold tracking-tight text-sm text-zinc-100">LMS Operations</span>
          </div>
          <button 
            className="md:hidden text-zinc-400 hover:text-zinc-200"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {filteredNavItems.length === 0 ? (
            <div className="p-3 text-xs text-zinc-500 italic">No modules accessible for role.</div>
          ) : (
            filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center space-x-2 px-3 py-2 text-xs font-medium border transition-colors
                    ${isActive 
                      ? 'bg-zinc-800 text-zinc-100 border-zinc-700' 
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 border-transparent'
                    }
                  `}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })
          )}
        </nav>

        {/* User Card footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/40">
          <div className="flex flex-col space-y-2">
            <div>
              <div className="text-xs font-semibold text-zinc-100 truncate">{user?.name}</div>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="inline-block px-1.5 py-0.2 bg-zinc-800 text-[9px] font-bold text-zinc-300 border border-zinc-700 tracking-wider uppercase font-mono">
                  {user?.role}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center space-x-1 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white py-1.5 text-xs font-semibold uppercase tracking-wider transition"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/20 z-10 md:hidden"
        />
      )}

      {/* Main dashboard view content */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-6 md:p-8 max-w-5xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
