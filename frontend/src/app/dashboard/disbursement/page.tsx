'use client';

import React, { useEffect, useState } from 'react';
import api from '../../../lib/api';
import { AlertCircle, Inbox } from 'lucide-react';
import TableSkeleton from '../../../components/TableSkeleton';
import { toast } from 'sonner';

export default function DisbursementPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/dashboard/disbursement');
      setData(response.data.loans || []);
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.error || 'Failed to fetch sanctioned loans.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDisburseLoan = async (loanId: string) => {
    setError('');
    setActionLoading(true);
    try {
      await api.put(`/dashboard/disbursement/${loanId}`);
      toast.success('Loan payout released and marked as disbursed!');
      fetchData();
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.error || 'Failed to disburse loan.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <TableSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-zinc-200 pb-4">
        <h1 className="text-xl font-bold tracking-tight">Disbursement Queue</h1>
        <p className="text-xs text-zinc-500 mt-1">
          Approve payouts and finalize disbursement actions for sanctioned loans.
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
              <th className="px-4 py-3">Borrower Details</th>
              <th className="px-4 py-3">Principal</th>
              <th className="px-4 py-3">Total Repayable</th>
              <th className="px-4 py-3 text-right">Actions</th>
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
                    <div className="text-[10px] text-zinc-400">No approved loans waiting for disbursement.</div>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((loan) => (
                <tr key={loan._id} className="hover:bg-zinc-50/50">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-zinc-950">{loan.borrowerId?.name}</div>
                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{loan.borrowerId?.email}</div>
                  </td>
                  <td className="px-4 py-3 font-mono font-semibold text-zinc-900">₹{loan.principalAmount.toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono text-zinc-600">₹{loan.totalRepayment.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDisburseLoan(loan._id)}
                      disabled={actionLoading}
                      className="bg-zinc-900 hover:bg-zinc-800 text-white font-semibold px-3 py-1.5 text-[11px] uppercase tracking-wider transition"
                    >
                      Mark as Disbursed
                    </button>
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
