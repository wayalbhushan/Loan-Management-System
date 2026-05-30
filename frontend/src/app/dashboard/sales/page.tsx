'use client';

import React, { useEffect, useState } from 'react';
import api from '../../../lib/api';
import { AlertCircle, Inbox, ExternalLink } from 'lucide-react';
import TableSkeleton from '../../../components/TableSkeleton';
import { toast } from 'sonner';

export default function SalesPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/dashboard/sales');
      setData(response.data.leads || []);
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.error || 'Failed to fetch sales leads.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <TableSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-zinc-200 pb-4">
        <h1 className="text-xl font-bold tracking-tight">Sales Leads</h1>
        <p className="text-xs text-zinc-500 mt-1">
          Manage registered borrowers and initiate sales contact.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <div className="bg-white border border-zinc-200 shadow-sm overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-200 text-left text-xs">
          <thead className="bg-zinc-50 text-zinc-500 font-semibold uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Full Name</th>
              <th className="px-4 py-3">Email Address</th>
              <th className="px-4 py-3">Registered Date</th>
              <th className="px-4 py-3">Documents</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {data.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-zinc-400">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="bg-zinc-50 border border-zinc-100 p-2.5 rounded-full inline-block">
                      <Inbox className="h-5 w-5 text-zinc-400" />
                    </div>
                    <div className="font-semibold text-zinc-800 text-xs uppercase tracking-wider">Queue is clear</div>
                    <div className="text-[10px] text-zinc-400">No new leads available.</div>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((lead) => (
                <tr key={lead._id} className="hover:bg-zinc-50/50">
                  <td className="px-4 py-3 font-semibold text-zinc-900">{lead.name}</td>
                  <td className="px-4 py-3 font-mono text-zinc-600">{lead.email}</td>
                  <td className="px-4 py-3 text-zinc-500">
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {lead.salarySlipUrl ? (
                      <a 
                        href={lead.salarySlipUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 font-semibold text-zinc-900 hover:underline"
                      >
                        <span>View Slip</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-zinc-400 italic">No Document</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
