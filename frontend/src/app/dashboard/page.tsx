'use client';

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
import { 
  Users, 
  CheckSquare, 
  CreditCard, 
  DollarSign, 
  ShieldCheck, 
  ArrowRight
} from 'lucide-react';

interface ModuleCard {
  name: string;
  description: string;
  href: string;
  icon: React.ComponentType<any>;
  allowedRoles: string[];
}

export default function DashboardRoot() {
  const { user } = useAuth();

  const cards: ModuleCard[] = [
    {
      name: 'Sales Leads',
      description: 'Manage registered borrowers and initiate lending sales leads.',
      href: '/dashboard/sales',
      icon: Users,
      allowedRoles: ['SALES', 'ADMIN'],
    },
    {
      name: 'Sanction Queue',
      description: 'Review credit profile documents, run BRE verification, and sanction applications.',
      href: '/dashboard/sanction',
      icon: CheckSquare,
      allowedRoles: ['SANCTION', 'ADMIN'],
    },
    {
      name: 'Disbursement Queue',
      description: 'Trigger payouts and verify disbursements for approved loan assets.',
      href: '/dashboard/disbursement',
      icon: CreditCard,
      allowedRoles: ['DISBURSEMENT', 'ADMIN'],
    },
    {
      name: 'Active Collections',
      description: 'Log borrower repayments, track balances, and settle transactions via UTR entries.',
      href: '/dashboard/collection',
      icon: DollarSign,
      allowedRoles: ['COLLECTION', 'ADMIN'],
    },
  ];

  // Filter cards by user role
  const visibleCards = cards.filter(card => 
    user && card.allowedRoles.includes(user.role)
  );

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-2">
          <div className="bg-zinc-900 text-white p-1.5 rounded">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h1 className="text-lg font-bold tracking-tight">Operations Console</h1>
        </div>
        <p className="text-sm text-zinc-800">
          Welcome back, <span className="font-semibold">{user?.name}</span>. You are logged in as{' '}
          <span className="inline-block px-1.5 py-0.2 bg-zinc-200 text-[10px] font-bold text-zinc-700 font-mono tracking-wider uppercase">
            {user?.role}
          </span>.
        </p>
        <p className="text-xs text-zinc-500 mt-2">
          Select an operations module below to manage customer applications, verify credit metrics, or settle collection entries.
        </p>
      </div>

      {/* Grid of quick links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleCards.length === 0 ? (
          <div className="col-span-2 border border-zinc-200 bg-white p-8 text-center text-xs text-zinc-400 italic">
            You do not have permissions to access any operational modules. Please contact system admin.
          </div>
        ) : (
          visibleCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link 
                key={card.href}
                href={card.href}
                className="border border-zinc-200 bg-white p-5 shadow-sm flex flex-col justify-between hover:border-zinc-900 transition group cursor-pointer"
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="bg-zinc-100 text-zinc-900 p-1.5 rounded">
                      <Icon className="h-4 w-4" />
                    </div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900">{card.name}</h2>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed">{card.description}</p>
                </div>
                <div className="pt-4 border-t border-zinc-100 mt-4 flex justify-end">
                  <div
                    className="inline-flex items-center space-x-1 text-xs font-semibold text-zinc-900 group-hover:underline"
                  >
                    <span>Open Module</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
