'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../lib/api';
import { toast } from 'sonner';
import { 
  User, 
  FileText, 
  DollarSign, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  Lock,
  ChevronRight,
  LogOut,
  ExternalLink
} from 'lucide-react';

function BorrowerDashboardView({ 
  loan, 
  profile, 
  onApplyNew, 
  onRefresh 
}: { 
  loan: any; 
  profile: any; 
  onApplyNew: () => void; 
  onRefresh: () => void; 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    pan: profile?.pan || '',
    dob: profile?.dob ? profile.dob.split('T')[0] : '',
    monthlySalary: profile?.monthlySalary?.toString() || '',
    employmentMode: profile?.employmentMode || 'SALARIED'
  });
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);

  // Sync edits if profile prop changes
  useEffect(() => {
    setEditData({
      pan: profile?.pan || '',
      dob: profile?.dob ? profile.dob.split('T')[0] : '',
      monthlySalary: profile?.monthlySalary?.toString() || '',
      employmentMode: profile?.employmentMode || 'SALARIED'
    });
  }, [profile]);

  const handleCancel = () => {
    setEditData({
      pan: profile?.pan || '',
      dob: profile?.dob ? profile.dob.split('T')[0] : '',
      monthlySalary: profile?.monthlySalary?.toString() || '',
      employmentMode: profile?.employmentMode || 'SALARIED'
    });
    setEditFile(null);
    setEditError('');
    setIsEditing(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setEditError('');

    const formData = new FormData();
    formData.append('pan', editData.pan.trim().toUpperCase());
    formData.append('dob', editData.dob);
    formData.append('monthlySalary', editData.monthlySalary);
    formData.append('employmentMode', editData.employmentMode);
    if (editFile) {
      formData.append('salarySlip', editFile);
    }

    try {
      await api.put('/borrower/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Profile details updated successfully!');
      setIsEditing(false);
      onRefresh();
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.error || err.response?.data?.reason || 'Failed to update profile details.';
      setEditError(errMsg);
      toast.error(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPLIED':
        return (
          <span className="inline-flex items-center px-3 py-1 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-full shadow-sm">
            ● Applied / Under Review
          </span>
        );
      case 'SANCTIONED':
        return (
          <span className="inline-flex items-center px-3 py-1 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-full shadow-sm">
            ● Approved / Sanctioned
          </span>
        );
      case 'DISBURSED':
        return (
          <span className="inline-flex items-center px-3 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full shadow-sm">
            ● Active / Disbursed
          </span>
        );
      case 'CLOSED':
        return (
          <span className="inline-flex items-center px-3 py-1 text-xs font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200 rounded-full shadow-sm">
            ● Settled / Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 text-xs font-semibold bg-zinc-50 text-zinc-500 border border-zinc-200 rounded-full">
            {status}
          </span>
        );
    }
  };

  const getTimelineSteps = () => {
    const status = loan.status;
    const steps = [
      { key: 'APPLIED', label: 'Applied', desc: 'Application Received' },
      { key: 'SANCTIONED', label: 'Approved', desc: 'Credit Sanctioned' },
      { key: 'DISBURSED', label: 'Disbursed', desc: 'Funds Transferred' },
      { key: 'CLOSED', label: 'Closed', desc: 'Loan Settled' }
    ];

    const getStatusIndex = (s: string) => {
      if (s === 'APPLIED') return 0;
      if (s === 'SANCTIONED') return 1;
      if (s === 'DISBURSED') return 2;
      if (s === 'CLOSED') return 3;
      return -1;
    };

    const currentIdx = getStatusIndex(status);

    return steps.map((step, idx) => {
      const isCompleted = idx < currentIdx || status === 'CLOSED';
      const isActive = idx === currentIdx && status !== 'CLOSED';
      return {
        ...step,
        isCompleted,
        isActive
      };
    });
  };

  const amountPaid = loan.amountPaid || 0;
  const totalRepayment = loan.totalRepayment;
  const payPercent = Math.min(100, Math.max(0, Math.round((amountPaid / totalRepayment) * 100)));

  return (
    <div className="space-y-6">
      {/* Welcome & Status Header Card */}
      <div className="bg-white border border-zinc-200 p-6 shadow-sm hover:shadow-md hover:border-zinc-300 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-zinc-900">Loan Status & Overview</h2>
          <p className="text-xs text-zinc-500 mt-1">
            Application ID: <span className="font-mono text-[10px]">{loan._id}</span>
          </p>
        </div>
        <div>
          {getStatusBadge(loan.status)}
        </div>
      </div>

      {/* Visual Progress Stepper (Timeline) */}
      <div className="bg-white border border-zinc-200 p-6 shadow-sm hover:shadow-md hover:border-zinc-300 transition-all duration-300">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-6">Application Progress</h3>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
          {getTimelineSteps().map((step, idx, arr) => (
            <React.Fragment key={step.key}>
              <div className="flex items-center space-x-3 md:flex-col md:space-x-0 md:space-y-2 md:flex-1 text-left md:text-center">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  step.isCompleted 
                    ? 'bg-zinc-900 border-zinc-900 text-white' 
                    : step.isActive 
                      ? 'border-zinc-900 text-zinc-900 bg-white font-bold animate-pulse' 
                      : 'border-zinc-200 text-zinc-300 bg-white'
                }`}>
                  {step.isCompleted ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <span className="text-xs">{idx + 1}</span>
                  )}
                </div>
                <div>
                  <div className={`text-xs font-bold ${step.isActive ? 'text-zinc-900' : step.isCompleted ? 'text-zinc-700' : 'text-zinc-400'}`}>
                    {step.label}
                  </div>
                  <div className="text-[10px] text-zinc-400">{step.desc}</div>
                </div>
              </div>
              {idx < arr.length - 1 && (
                <div className={`hidden md:block h-0.5 flex-1 transition-all duration-500 ${
                  step.isCompleted ? 'bg-zinc-900' : 'bg-zinc-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Financial Details Card & Support Panel */}
        <div className="md:col-span-2 space-y-6">
          {/* Financials Card */}
          <div className="bg-white border border-zinc-200 p-6 shadow-sm hover:shadow-md hover:border-zinc-300 transition-all duration-300 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-2 flex items-center space-x-1.5">
                <DollarSign className="h-4 w-4 text-zinc-400" />
                <span>Financial Parameters</span>
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Requested Principal</span>
                  <span className="text-base font-mono font-bold text-zinc-900">₹{loan.principalAmount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Interest Rate</span>
                  <span className="text-base font-mono font-bold text-zinc-900">{loan.interestRate}% p.a.</span>
                </div>
                <div>
                  <span className="block text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Repayment Tenure</span>
                  <span className="text-base font-mono font-bold text-zinc-900">{loan.tenureDays} Days</span>
                </div>
                <div>
                  <span className="block text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Total Repayable</span>
                  <span className="text-base font-mono font-bold text-zinc-900">₹{loan.totalRepayment.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Repayment Progress (Only show if Disbursed or Closed, or amountPaid > 0) */}
            {(loan.status === 'DISBURSED' || loan.status === 'CLOSED' || amountPaid > 0) && (
              <div className="mt-6 pt-4 border-t border-zinc-100 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-zinc-700">Repayment Progress</span>
                  <span className="font-mono text-[11px] text-zinc-500">
                    ₹{amountPaid.toLocaleString()} paid of ₹{totalRepayment.toLocaleString()} ({payPercent}%)
                  </span>
                </div>
                <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-zinc-950 h-2 transition-all duration-500" 
                    style={{ width: `${payPercent}%` }}
                  />
                </div>
              </div>
            )}

            {loan.status === 'CLOSED' && (
              <button
                onClick={onApplyNew}
                className="mt-6 w-full bg-zinc-900 text-white text-xs font-semibold uppercase tracking-wider py-2.5 hover:bg-zinc-800 transition"
              >
                Apply for a New Loan
              </button>
            )}
          </div>

          {/* Help & Support Card */}
          <div className="bg-white border border-zinc-200 p-6 shadow-sm hover:shadow-md hover:border-zinc-300 transition-all duration-300 space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-2 flex items-center space-x-1.5">
              <AlertCircle className="h-4 w-4 text-zinc-400" />
              <span>Support & FAQs</span>
            </h3>
            <div className="space-y-3 text-xs">
              <details className="group cursor-pointer">
                <summary className="font-semibold text-zinc-700 hover:text-zinc-900 flex items-center justify-between">
                  <span>When will my loan be disbursed?</span>
                  <span className="transition group-open:rotate-180 text-[10px]">▼</span>
                </summary>
                <p className="text-[11px] text-zinc-500 mt-1 pl-1">
                  Once sanctioned, our Disbursement Managers verify bank details and transfer funds within 24-48 business hours.
                </p>
              </details>
              <details className="group cursor-pointer">
                <summary className="font-semibold text-zinc-700 hover:text-zinc-900 flex items-center justify-between">
                  <span>Can I prepay my loan early?</span>
                  <span className="transition group-open:rotate-180 text-[10px]">▼</span>
                </summary>
                <p className="text-[11px] text-zinc-500 mt-1 pl-1">
                  Yes! There are zero foreclosure fees. You can pay the total repayable amount at any time to close your loan.
                </p>
              </details>
              <details className="group cursor-pointer">
                <summary className="font-semibold text-zinc-700 hover:text-zinc-900 flex items-center justify-between">
                  <span>Need assistance?</span>
                  <span className="transition group-open:rotate-180 text-[10px]">▼</span>
                </summary>
                <p className="text-[11px] text-zinc-500 mt-1 pl-1">
                  Contact our support team at <span className="font-semibold">support@lms.com</span> for credit disputes or repayment receipts.
                </p>
              </details>
            </div>
          </div>
        </div>

        {/* Profile Card / Inline Editor */}
        <div className="bg-white border border-zinc-200 p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-zinc-300 transition-all duration-300">
          {isEditing ? (
            <form onSubmit={handleEditSubmit} className="space-y-4 h-full flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-2 flex items-center space-x-1.5">
                  <User className="h-4 w-4 text-zinc-400" />
                  <span>Edit Profile</span>
                </h3>

                {editError && (
                  <p className="text-red-600 text-xs font-semibold bg-red-50 p-2 border border-red-100">{editError}</p>
                )}

                {/* PAN */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">PAN Number</label>
                  <input
                    type="text"
                    value={editData.pan}
                    onChange={(e) => setEditData({ ...editData, pan: e.target.value })}
                    className="w-full text-xs border border-zinc-200 px-3 py-2 outline-none font-mono focus:border-zinc-900"
                    required
                  />
                </div>

                {/* DOB */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Date of Birth</label>
                  <input
                    type="date"
                    value={editData.dob}
                    onChange={(e) => setEditData({ ...editData, dob: e.target.value })}
                    className="w-full text-xs border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-900"
                    required
                  />
                </div>

                {/* Monthly Salary */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Monthly Salary (INR)</label>
                  <input
                    type="number"
                    value={editData.monthlySalary}
                    onChange={(e) => setEditData({ ...editData, monthlySalary: e.target.value })}
                    className="w-full text-xs border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-900"
                    required
                  />
                </div>

                {/* Employment Mode */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Employment Mode</label>
                  <select
                    value={editData.employmentMode}
                    onChange={(e) => setEditData({ ...editData, employmentMode: e.target.value })}
                    className="w-full text-xs border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-900"
                  >
                    <option value="SALARIED">SALARIED</option>
                    <option value="SELF_EMPLOYED">SELF EMPLOYED</option>
                  </select>
                </div>

                {/* File Upload */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Update Salary Slip (Optional)</label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setEditFile(e.target.files[0]);
                      }
                    }}
                    className="w-full text-[10px] text-zinc-500 border border-zinc-200 p-1"
                  />
                </div>
              </div>

              <div className="flex space-x-2 pt-4 border-t border-zinc-100 mt-6">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex-1 border border-zinc-200 text-zinc-700 py-2 text-xs font-semibold uppercase tracking-wider hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-zinc-900 text-white py-2 text-xs font-semibold uppercase tracking-wider hover:bg-zinc-800 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 h-full flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-2 flex items-center space-x-1.5">
                  <User className="h-4 w-4 text-zinc-400" />
                  <span>Borrower Profile</span>
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="block text-[10px] text-zinc-400 font-medium uppercase tracking-wider">PAN Number</span>
                    <span className="font-mono font-bold text-zinc-900">{profile?.pan || 'N/A'}</span>
                  </div>
                  
                  <div>
                    <span className="block text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Declared Monthly Income</span>
                    <span className="font-mono font-bold text-zinc-900">
                      {profile?.monthlySalary ? `₹${profile.monthlySalary.toLocaleString()}` : 'N/A'}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Employment Type</span>
                    <span className="font-bold text-zinc-900">{profile?.employmentMode || 'N/A'}</span>
                  </div>

                  <div>
                    <span className="block text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Date of Birth</span>
                    <span className="font-bold text-zinc-900">
                      {profile?.dob ? new Date(profile.dob).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-100 space-y-2">
                {profile?.salarySlipUrl && (
                  <a 
                    href={profile.salarySlipUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center space-x-2 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 py-2 text-xs font-semibold uppercase tracking-wider transition"
                  >
                    <span>View Salary Slip</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                {loan.status === 'APPLIED' ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full bg-zinc-900 text-white py-2 text-xs font-semibold uppercase tracking-wider hover:bg-zinc-800 transition"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <p className="text-[10px] text-zinc-400 italic text-center pt-2">
                    Profile locked. Changes cannot be made on approved or active loans.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BorrowerPortal() {
  const { user, logout } = useAuth();
  const [step, setStep] = useState(1);
  const [loadingData, setLoadingData] = useState(true);
  const [activeProfile, setActiveProfile] = useState<any | null>(null);
  const [activeLoan, setActiveLoan] = useState<any | null>(null);
  const [hasActiveLoan, setHasActiveLoan] = useState(false);

  const loadBorrowerData = async (showError = true) => {
    try {
      const response = await api.get('/borrower/me');
      const { profile, loan } = response.data;
      setActiveProfile(profile);
      setActiveLoan(loan);
      if (loan) {
        setHasActiveLoan(true);
      } else {
        setHasActiveLoan(false);
      }
    } catch (err: any) {
      console.error(err);
      if (showError) {
        toast.error('Failed to load active loan details.');
      }
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadBorrowerData();
  }, []);
  
  // Step 1: Profile & Client-Side BRE state
  const [profileData, setProfileData] = useState({
    pan: '',
    dob: '',
    monthlySalary: '',
    employmentMode: 'SALARIED',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Step 2: Salary Slip Upload state
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [uploading, setUploading] = useState(false);

  // Step 3: Loan Configuration state
  const [principalAmount, setPrincipalAmount] = useState(100000);
  const [tenureDays, setTenureDays] = useState(90);
  const [submittingLoan, setSubmittingLoan] = useState(false);
  const [loanError, setLoanError] = useState('');
  const [loanSuccess, setLoanSuccess] = useState(false);

  // Calculation in real-time
  const interestRate = 12;
  const simpleInterest = (principalAmount * interestRate * tenureDays) / (365 * 100);
  const roundedInterest = Math.round(simpleInterest * 100) / 100;
  const totalRepayment = principalAmount + roundedInterest;

  // Local Client-Side BRE check
  const validateBRE = () => {
    const newErrors: Record<string, string> = {};
    
    // 1. PAN check
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(profileData.pan.trim().toUpperCase())) {
      newErrors.pan = 'Invalid PAN format. Must be 5 uppercase letters, 4 numbers, and 1 uppercase letter.';
    }

    // 2. Age check (23-50 inclusive)
    if (!profileData.dob) {
      newErrors.dob = 'Date of birth is required.';
    } else {
      const birthDate = new Date(profileData.dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 23 || age > 50) {
        newErrors.dob = `Borrower must be between 23 and 50 years old. Calculated age is ${age}.`;
      }
    }

    // 3. Salary check (>= 25,000)
    const salary = Number(profileData.monthlySalary);
    if (!profileData.monthlySalary || isNaN(salary) || salary < 25000) {
      newErrors.monthlySalary = 'Monthly salary must be a number greater than or equal to 25,000.';
    }

    // 4. Employment mode check
    if (profileData.employmentMode === 'UNEMPLOYED') {
      newErrors.employmentMode = 'Unemployed mode is not eligible for loans.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateBRE()) {
      toast.success("Business Rules Engine (BRE) check passed!");
      setStep(2);
    } else {
      toast.error("Eligibility check failed. Please review the highlighted fields.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 5 * 1024 * 1024) {
        setFileError('File size exceeds the 5MB limit.');
        setFile(null);
      } else {
        setFileError('');
        setFile(selectedFile);
      }
    }
  };

  const handleProfileSubmit = async () => {
    if (!file) {
      setFileError('Please select a salary slip document.');
      toast.error('Salary slip document is required.');
      return;
    }

    setUploading(true);
    setFileError('');

    const formData = new FormData();
    formData.append('pan', profileData.pan.trim().toUpperCase());
    formData.append('dob', profileData.dob);
    formData.append('monthlySalary', profileData.monthlySalary);
    formData.append('employmentMode', profileData.employmentMode);
    formData.append('salarySlip', file);

    try {
      await api.post('/borrower/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success("Income details and salary slip verified successfully!");
      await loadBorrowerData(false);
      setStep(3);
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.error || err.response?.data?.reason || 'Failed to submit profile details.';
      setFileError(errMsg);
      toast.error(errMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleLoanSubmit = async () => {
    setSubmittingLoan(true);
    setLoanError('');

    try {
      await api.post('/borrower/loan', {
        principalAmount,
        tenureDays,
      });
      toast.success("Loan application submitted successfully!");
      await loadBorrowerData(false);
      setStep(4);
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.error || 'Failed to submit loan application.';
      setLoanError(errMsg);
      toast.error(errMsg);
    } finally {
      setSubmittingLoan(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-4xl space-y-6 animate-pulse">
          <div className="h-10 bg-zinc-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-40 bg-zinc-200 rounded"></div>
            <div className="h-40 bg-zinc-200 rounded col-span-2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-zinc-900 text-white p-1 rounded">
              <Lock className="h-4 w-4" />
            </div>
            <span className="font-semibold tracking-tight text-sm">LMS Borrower Portal</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-xs text-zinc-500 font-medium">{user?.email}</span>
            <button
              onClick={logout}
              className="text-zinc-600 hover:text-zinc-900 transition flex items-center space-x-1 text-xs border border-zinc-200 px-2 py-1 bg-white hover:bg-zinc-50 font-medium"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main body */}
      <main className={`flex-1 w-full mx-auto px-4 py-12 transition-all duration-300 ${hasActiveLoan && step !== 4 ? 'max-w-4xl' : 'max-w-lg'}`}>
        {hasActiveLoan && step !== 4 ? (
          <BorrowerDashboardView 
            loan={activeLoan} 
            profile={activeProfile} 
            onApplyNew={() => {
              setHasActiveLoan(false);
              setStep(1);
            }} 
            onRefresh={() => {
              loadBorrowerData(false);
            }}
          />
        ) : (
          <>
            {/* Step Indicator Header */}
            {step < 4 && (
              <div className="mb-8">
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  <span>Step {step} of 3</span>
                  <span>
                    {step === 1 && 'Profile Details'}
                    {step === 2 && 'Salary Slip Verification'}
                    {step === 3 && 'Configure Loan'}
                  </span>
                </div>
                <div className="w-full bg-zinc-200 h-1">
                  <div 
                    className="bg-zinc-900 h-1 transition-all duration-300"
                    style={{ width: `${(step / 3) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* WIZARD CONTAINER */}
            <div className="bg-white border border-zinc-200 p-6 shadow-sm">
              {/* STEP 1 */}
              {step === 1 && (
                <form onSubmit={handleStep1Submit} className="space-y-4">
                  <div className="mb-4 border-b border-zinc-100 pb-3">
                    <h1 className="text-base font-semibold tracking-tight">Personal & Financial Information</h1>
                    <p className="text-xs text-zinc-500 mt-1">Provide your details to evaluate lending eligibility rules.</p>
                  </div>

                  {/* PAN */}
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-zinc-700">PAN Number (Permanent Account Number)</label>
                    <input
                      type="text"
                      placeholder="ABCDE1234F"
                      value={profileData.pan}
                      onChange={(e) => setProfileData({ ...profileData, pan: e.target.value })}
                      className={`w-full text-sm border px-3 py-2 outline-none font-mono focus:border-zinc-900 ${
                        errors.pan ? 'border-red-500 bg-red-50/20' : 'border-zinc-200'
                      }`}
                    />
                    {errors.pan && <p className="text-red-600 text-xs font-medium mt-0.5">{errors.pan}</p>}
                  </div>

                  {/* DOB */}
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-zinc-700">Date of Birth</label>
                    <input
                      type="date"
                      value={profileData.dob}
                      onChange={(e) => setProfileData({ ...profileData, dob: e.target.value })}
                      className={`w-full text-sm border px-3 py-2 outline-none focus:border-zinc-900 ${
                        errors.dob ? 'border-red-500 bg-red-50/20' : 'border-zinc-200'
                      }`}
                    />
                    {errors.dob && <p className="text-red-600 text-xs font-medium mt-0.5">{errors.dob}</p>}
                  </div>

                  {/* Salary */}
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-zinc-700">Monthly Salary (INR)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-zinc-400 text-xs font-semibold">₹</span>
                      <input
                        type="number"
                        placeholder="35,000"
                        value={profileData.monthlySalary}
                        onChange={(e) => setProfileData({ ...profileData, monthlySalary: e.target.value })}
                        className={`w-full text-sm border pl-7 pr-3 py-2 outline-none focus:border-zinc-900 ${
                          errors.monthlySalary ? 'border-red-500 bg-red-50/20' : 'border-zinc-200'
                        }`}
                      />
                    </div>
                    {errors.monthlySalary && <p className="text-red-600 text-xs font-medium mt-0.5">{errors.monthlySalary}</p>}
                  </div>

                  {/* Employment */}
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-zinc-700">Employment Mode</label>
                    <select
                      value={profileData.employmentMode}
                      onChange={(e) => setProfileData({ ...profileData, employmentMode: e.target.value })}
                      className={`w-full text-sm border px-3 py-2 outline-none focus:border-zinc-900 ${
                        errors.employmentMode ? 'border-red-500 bg-red-50/20' : 'border-zinc-200'
                      }`}
                    >
                      <option value="SALARIED">SALARIED</option>
                      <option value="SELF_EMPLOYED">SELF EMPLOYED</option>
                      <option value="UNEMPLOYED">UNEMPLOYED</option>
                    </select>
                    {errors.employmentMode && <p className="text-red-600 text-xs font-medium mt-0.5">{errors.employmentMode}</p>}
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-zinc-900 text-white text-xs font-semibold uppercase tracking-wider py-2.5 hover:bg-zinc-800 transition flex items-center justify-center space-x-1"
                  >
                    <span>Run BRE Verification</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </form>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="mb-4 border-b border-zinc-100 pb-3">
                    <h1 className="text-base font-semibold tracking-tight">Upload Salary Proof</h1>
                    <p className="text-xs text-zinc-500 mt-1">Please upload your latest salary slip to complete profile mapping.</p>
                  </div>

                  <div className="border-2 border-dashed border-zinc-200 p-8 text-center bg-zinc-50">
                    <FileText className="h-8 w-8 mx-auto text-zinc-400 mb-2" />
                    <label className="cursor-pointer block text-xs font-semibold text-zinc-700 underline hover:text-zinc-900 mb-1">
                      Click to select file
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[10px] text-zinc-400">PDF, JPG, PNG up to 5MB</p>
                    
                    {file && (
                      <div className="mt-4 border border-zinc-200 bg-white p-2 text-left flex items-center justify-between text-xs">
                        <span className="truncate max-w-[200px] font-mono text-zinc-600">{file.name}</span>
                        <span className="text-[10px] text-zinc-400">({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                      </div>
                    )}
                  </div>

                  {fileError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2">
                      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span className="font-medium">{fileError}</span>
                    </div>
                  )}

                  <div className="flex space-x-3 pt-2">
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => setStep(1)}
                      className="flex-1 border border-zinc-200 text-zinc-700 py-2.5 text-xs font-semibold uppercase tracking-wider hover:bg-zinc-50 transition"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={uploading || !file}
                      onClick={handleProfileSubmit}
                      className="flex-1 bg-zinc-900 text-white py-2.5 text-xs font-semibold uppercase tracking-wider hover:bg-zinc-800 disabled:opacity-50 transition flex items-center justify-center space-x-1"
                    >
                      {uploading ? (
                        <span>Uploading...</span>
                      ) : (
                        <>
                          <span>Submit Profile</span>
                          <ChevronRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <div className="space-y-5">
                  <div className="mb-4 border-b border-zinc-100 pb-3">
                    <h1 className="text-base font-semibold tracking-tight">Configure Loan Application</h1>
                    <p className="text-xs text-zinc-500 mt-1">Select your principal limit and repayment duration.</p>
                  </div>

                  {/* Principal Slider */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-zinc-700">Principal Amount</label>
                      <span className="text-xs font-mono font-bold">₹{principalAmount.toLocaleString()}</span>
                    </div>
                    <input
                      type="range"
                      min="50000"
                      max="500000"
                      step="10000"
                      value={principalAmount}
                      onChange={(e) => setPrincipalAmount(Number(e.target.value))}
                      className="w-full py-3 h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900 focus:outline-none"
                    />
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                      <span>₹50K</span>
                      <span>₹500K</span>
                    </div>
                  </div>

                  {/* Tenure Slider */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-zinc-700">Tenure (Days)</label>
                      <span className="text-xs font-mono font-bold">{tenureDays} Days</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="365"
                      step="5"
                      value={tenureDays}
                      onChange={(e) => setTenureDays(Number(e.target.value))}
                      className="w-full py-3 h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900 focus:outline-none"
                    />
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                      <span>30 Days</span>
                      <span>365 Days</span>
                    </div>
                  </div>

                  {/* Real-time Calculation Card */}
                  <div className="border border-zinc-200 p-4 bg-zinc-50 space-y-3">
                    <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-200 pb-1.5">
                      Calculation Breakdown
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Interest Rate (Simple Interest)</span>
                      <span className="font-mono text-zinc-700 font-semibold">{interestRate}% p.a.</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">Accrued Interest (SI)</span>
                      <span className="font-mono text-zinc-700 font-semibold">₹{roundedInterest.toLocaleString()}</span>
                    </div>

                    <div className="border-t border-zinc-200 pt-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-900">Total Repayment Amount</span>
                      <span className="font-mono text-sm font-bold text-zinc-900">₹{totalRepayment.toLocaleString()}</span>
                    </div>
                  </div>

                  {loanError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2">
                      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span className="font-medium">{loanError}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={submittingLoan}
                    onClick={handleLoanSubmit}
                    className="w-full bg-zinc-900 text-white text-xs font-semibold uppercase tracking-wider py-2.5 hover:bg-zinc-800 disabled:opacity-50 transition flex items-center justify-center space-x-1"
                  >
                    {submittingLoan ? (
                      <span>Submitting Application...</span>
                    ) : (
                      <>
                        <span>Submit Loan Application</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* SUCCESS STATUS */}
              {step === 4 && (
                <div className="py-6 text-center space-y-4">
                  <div className="inline-flex p-3 bg-green-50 rounded-full border border-green-200 text-green-600">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <h1 className="text-base font-semibold tracking-tight">Loan Application Submitted</h1>
                    <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                      Your application has been logged successfully and is currently under review by our Sanction Officers.
                    </p>
                  </div>
                  
                  <div className="border border-zinc-100 p-4 bg-zinc-50 text-left rounded space-y-2">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-400">Principal Requested:</span>
                      <span className="font-mono font-semibold">₹{principalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-400">Duration selected:</span>
                      <span className="font-mono font-semibold">{tenureDays} Days</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-400">Total Repayable:</span>
                      <span className="font-mono font-semibold">₹{totalRepayment.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setStep(3);
                      }}
                      className="border border-zinc-200 bg-white text-zinc-700 px-4 py-2 text-xs font-semibold uppercase tracking-wider hover:bg-zinc-50 transition"
                    >
                      Apply for Another Loan
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
