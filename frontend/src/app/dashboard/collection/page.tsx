'use client';

import React, { useEffect, useState } from 'react';
import api from '../../../lib/api';
import { AlertCircle, Inbox } from 'lucide-react';
import TableSkeleton from '../../../components/TableSkeleton';
import { toast } from 'sonner';

export default function CollectionPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedLoan, setSelectedLoan] = useState<any | null>(null);
  const [utrNumber, setUtrNumber] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/dashboard/collection');
      setData(response.data.loans || []);
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.error || 'Failed to fetch active collection loans.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrNumber.trim()) {
      setActionError('UTR Number is required.');
      return;
    }
    if (!paymentAmount.trim() || Number(paymentAmount) <= 0) {
      setActionError('Please specify a valid payment amount.');
      return;
    }

    setActionError('');
    setActionLoading(true);
    try {
      await api.post(`/dashboard/collection/${selectedLoan._id}/payment`, {
        utrNumber: utrNumber.trim().toUpperCase(),
        amount: Number(paymentAmount)
      });
      toast.success(`Payment of ₹${Number(paymentAmount).toLocaleString()} logged successfully (UTR: ${utrNumber.trim().toUpperCase()})`);
      setPaymentModalOpen(false);
      setSelectedLoan(null);
      setUtrNumber('');
      setPaymentAmount('');
      fetchData();
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.error || 'Failed to record payment.';
      setActionError(errMsg);
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
        <h1 className="text-xl font-bold tracking-tight">Active Collections</h1>
        <p className="text-xs text-zinc-500 mt-1">
          Record client repayments and track outstanding balances.
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
              <th className="px-4 py-3">Total Repayable</th>
              <th className="px-4 py-3">Amount Paid</th>
              <th className="px-4 py-3">Outstanding Balance</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-zinc-400">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="bg-zinc-50 border border-zinc-100 p-2.5 rounded-full inline-block">
                      <Inbox className="h-5 w-5 text-zinc-400" />
                    </div>
                    <div className="font-semibold text-zinc-800 text-xs uppercase tracking-wider">Queue is clear</div>
                    <div className="text-[10px] text-zinc-400">No active disbursed loans.</div>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((loan) => {
                const balance = Math.max(0, loan.totalRepayment - loan.amountPaid);
                return (
                  <tr key={loan._id} className="hover:bg-zinc-50/50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-zinc-955">{loan.borrowerId?.name}</div>
                      <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{loan.borrowerId?.email}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-zinc-700">₹{loan.totalRepayment.toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono text-green-700 font-medium">₹{loan.amountPaid.toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono text-red-700 font-semibold">₹{balance.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedLoan(loan);
                          setPaymentModalOpen(true);
                        }}
                        disabled={actionLoading}
                        className="bg-zinc-900 hover:bg-zinc-800 text-white font-semibold px-3 py-1.5 text-[11px] uppercase tracking-wider transition"
                      >
                        Record Payment
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* RECORD PAYMENT MODAL */}
      {paymentModalOpen && selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white border border-zinc-200 max-w-sm w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-100">
            <h3 className="text-sm font-bold text-zinc-900 tracking-tight mb-1">Record Repayment</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Input UTR number to prevent payment replays for borrower {selectedLoan.borrowerId?.name}.
            </p>
            
            <form onSubmit={handlePaymentSubmit} className="space-y-3">
              {actionError && (
                <div className="p-2 bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                  {actionError}
                </div>
              )}
              
              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase">UTR Transaction ID</label>
                <input
                  type="text"
                  placeholder="UTR9876543210"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  className="w-full text-xs border border-zinc-200 px-2 py-1.5 outline-none font-mono uppercase focus:border-zinc-900 mt-1"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-500 uppercase">Payment Amount (INR)</label>
                <input
                  type="number"
                  placeholder="25000"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full text-xs border border-zinc-200 px-2 py-1.5 outline-none focus:border-zinc-900 mt-1"
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentModalOpen(false);
                    setSelectedLoan(null);
                    setUtrNumber('');
                    setPaymentAmount('');
                  }}
                  className="border border-zinc-200 text-zinc-700 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-zinc-900 text-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wider hover:bg-zinc-800 disabled:opacity-50"
                >
                  {actionLoading ? 'Recording...' : 'Submit Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
