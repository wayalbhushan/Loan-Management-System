'use client';

import React, { useEffect, useState } from 'react';
import api from '../../../lib/api';
import { AlertCircle, ExternalLink, Inbox } from 'lucide-react';
import TableSkeleton from '../../../components/TableSkeleton';
import { toast } from 'sonner';

export default function SanctionPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedLoan, setSelectedLoan] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/dashboard/sanction');
      setData(response.data.loans || []);
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.error || 'Failed to fetch applied loans.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApproveLoan = async (loanId: string) => {
    setError('');
    setActionLoading(true);
    try {
      await api.put(`/dashboard/sanction/${loanId}`, { status: 'SANCTIONED' });
      toast.success('Loan application successfully sanctioned/approved!');
      fetchData();
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.error || 'Failed to approve loan.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setActionError('Rejection reason is required.');
      return;
    }
    setActionError('');
    setActionLoading(true);
    try {
      await api.put(`/dashboard/sanction/${selectedLoan._id}`, { 
        status: 'REJECTED', 
        rejectionReason: rejectionReason.trim() 
      });
      toast.success('Loan application successfully rejected.');
      setRejectModalOpen(false);
      setSelectedLoan(null);
      setRejectionReason('');
      fetchData();
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.error || 'Failed to reject loan.';
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
        <h1 className="text-xl font-bold tracking-tight">Sanction Queue</h1>
        <p className="text-xs text-zinc-500 mt-1">
          Review applied loan options, credit profiles, and make lending decisions.
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
              <th className="px-4 py-3">Tenure</th>
              <th className="px-4 py-3">Salary Slips</th>
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
                    <div className="text-[10px] text-zinc-400">No loans pending sanction review.</div>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((loan) => (
                <tr key={loan._id} className="hover:bg-zinc-50/50">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-zinc-955">{loan.borrowerId?.name}</div>
                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{loan.borrowerId?.email}</div>
                    {loan.borrowerProfile && (
                      <div className="text-[10px] text-zinc-500 font-mono mt-1">
                        PAN: {loan.borrowerProfile.pan} | Salary: ₹{loan.borrowerProfile.monthlySalary.toLocaleString()}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono font-semibold text-zinc-900">₹{loan.principalAmount.toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono text-zinc-600">{loan.tenureDays} Days</td>
                  <td className="px-4 py-3">
                    {loan.borrowerProfile?.salarySlipUrl ? (
                      <a 
                        href={loan.borrowerProfile.salarySlipUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 font-semibold text-zinc-900 hover:underline"
                      >
                        <span>View Slip</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-zinc-400 italic">None</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => handleApproveLoan(loan._id)}
                      disabled={actionLoading}
                      className="bg-zinc-900 hover:bg-zinc-800 text-white font-semibold px-2.5 py-1 text-[11px] uppercase tracking-wider transition"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setSelectedLoan(loan);
                        setRejectModalOpen(true);
                      }}
                      disabled={actionLoading}
                      className="border border-red-200 text-red-600 hover:bg-red-50 font-semibold px-2.5 py-1 text-[11px] uppercase tracking-wider transition"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* REJECTION MODAL */}
      {rejectModalOpen && selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white border border-zinc-200 max-w-sm w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-100">
            <h3 className="text-sm font-bold text-zinc-900 tracking-tight mb-2">Specify Rejection Reason</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Enter the credit evaluation reason for rejecting {selectedLoan.borrowerId?.name}'s application.
            </p>
            
            <form onSubmit={handleRejectLoanSubmit} className="space-y-4">
              {actionError && (
                <p className="text-red-600 text-xs font-semibold">{actionError}</p>
              )}
              
              <textarea
                placeholder="Applicant age does not match minimum criteria or invalid files."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full text-xs border border-zinc-200 p-2 h-20 outline-none focus:border-zinc-900"
                required
              />
              
              <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => {
                    setRejectModalOpen(false);
                    setSelectedLoan(null);
                    setRejectionReason('');
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
                  {actionLoading ? 'Saving...' : 'Submit Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
