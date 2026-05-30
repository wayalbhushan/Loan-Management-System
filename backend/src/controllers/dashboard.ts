import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { BorrowerProfile } from '../models/BorrowerProfile';
import { Loan } from '../models/Loan';
import { Payment } from '../models/Payment';

// 1. Sales Dashboard: Users registered as BORROWER who have no Loans
export const getSalesLeads = async (req: Request, res: Response) => {
  try {
    const leads = await User.aggregate([
      { $match: { role: 'BORROWER' } },
      {
        $lookup: {
          from: 'borrowerprofiles',
          localField: '_id',
          foreignField: 'userId',
          as: 'profile'
        }
      },
      {
        $lookup: {
          from: 'loans',
          localField: '_id',
          foreignField: 'borrowerId',
          as: 'loans'
        }
      },
      {
        $match: {
          loans: { $size: 0 }
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          role: 1,
          createdAt: 1,
          salarySlipUrl: { $arrayElemAt: ['$profile.salarySlipUrl', 0] }
        }
      }
    ]);

    return res.status(200).json({ leads });
  } catch (error: any) {
    console.error('Get sales leads error:', error);
    return res.status(500).json({ error: 'Internal server error fetching sales leads.' });
  }
};

// Helper: Populate Loan with Borrower Profile Details
const getLoansWithProfile = async (filter: any) => {
  const loans = await Loan.find(filter).populate('borrowerId', 'name email');
  const validLoans = loans.filter(l => l.borrowerId !== null && l.borrowerId !== undefined);
  const borrowerIds = validLoans.map(l => (l.borrowerId as any)._id);
  const profiles = await BorrowerProfile.find({ userId: { $in: borrowerIds } });

  return validLoans.map(loan => {
    const profile = profiles.find(p => p.userId.toString() === (loan.borrowerId as any)._id.toString());
    return {
      ...loan.toObject(),
      salarySlipUrl: profile ? profile.salarySlipUrl : null,
      borrowerProfile: profile || null
    };
  });
};

// 2. Sanction Dashboard: Loans with status APPLIED
export const getAppliedLoans = async (req: Request, res: Response) => {
  try {
    const loansWithProfiles = await getLoansWithProfile({ status: 'APPLIED' });
    return res.status(200).json({ loans: loansWithProfiles });
  } catch (error: any) {
    console.error('Get applied loans error:', error);
    return res.status(500).json({ error: 'Internal server error fetching applied loans.' });
  }
};

// Sanction Action: Approve (SANCTIONED) or Reject (REJECTED)
export const updateSanctionState = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!status || !['SANCTIONED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Status must be SANCTIONED or REJECTED.' });
    }

    if (status === 'REJECTED' && (!rejectionReason || !rejectionReason.trim())) {
      return res.status(400).json({ error: 'Rejection reason is required when status is REJECTED.' });
    }

    const loan = await Loan.findOne({ _id: id, status: 'APPLIED' });
    if (!loan) {
      return res.status(404).json({ error: 'Loan application not found or not in APPLIED state.' });
    }

    loan.status = status;
    if (status === 'REJECTED') {
      loan.rejectionReason = rejectionReason;
    } else {
      loan.rejectionReason = undefined;
    }

    await loan.save();

    return res.status(200).json({
      message: `Loan status successfully updated to ${status}.`,
      loan
    });
  } catch (error: any) {
    console.error('Update sanction state error:', error);
    return res.status(500).json({ error: 'Internal server error updating sanction state.' });
  }
};

// 3. Disbursement Dashboard: Loans with status SANCTIONED
export const getSanctionedLoans = async (req: Request, res: Response) => {
  try {
    const loansWithProfiles = await getLoansWithProfile({ status: 'SANCTIONED' });
    return res.status(200).json({ loans: loansWithProfiles });
  } catch (error: any) {
    console.error('Get sanctioned loans error:', error);
    return res.status(500).json({ error: 'Internal server error fetching sanctioned loans.' });
  }
};

// Disbursement Action: Disburse Loan (DISBURSED)
export const updateDisburseState = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const loan = await Loan.findOne({ _id: id, status: 'SANCTIONED' });
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found or not in SANCTIONED state.' });
    }

    loan.status = 'DISBURSED';
    await loan.save();

    return res.status(200).json({
      message: 'Loan successfully updated to DISBURSED state.',
      loan
    });
  } catch (error: any) {
    console.error('Update disburse state error:', error);
    return res.status(500).json({ error: 'Internal server error updating disbursement.' });
  }
};

// 4. Collection Dashboard: Loans with status DISBURSED
export const getDisbursedLoans = async (req: Request, res: Response) => {
  try {
    const loansWithProfiles = await getLoansWithProfile({ status: 'DISBURSED' });
    return res.status(200).json({ loans: loansWithProfiles });
  } catch (error: any) {
    console.error('Get disbursed loans error:', error);
    return res.status(500).json({ error: 'Internal server error fetching disbursed loans.' });
  }
};

// Collection Action: Record a Payment and update Loan outstanding balance
export const recordPayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { utrNumber, amount } = req.body;

    if (!utrNumber || !amount) {
      return res.status(400).json({ error: 'UTR number and payment amount are required.' });
    }

    const paymentAmount = Number(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({ error: 'Payment amount must be a positive number.' });
    }

    const loan = await Loan.findOne({ _id: id, status: 'DISBURSED' });
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found or not currently in DISBURSED state.' });
    }

    // Check if UTR number already exists to prevent double replay
    const existingPayment = await Payment.findOne({ utrNumber: utrNumber.trim().toUpperCase() });
    if (existingPayment) {
      return res.status(400).json({ error: 'Duplicate Payment: UTR number has already been recorded.' });
    }

    // Transactional save
    const newPayment = await Payment.create({
      loanId: loan._id,
      utrNumber: utrNumber.trim().toUpperCase(),
      amount: paymentAmount,
      recordedBy: req.user?.id
    });

    loan.amountPaid += paymentAmount;
    if (loan.amountPaid >= loan.totalRepayment) {
      loan.status = 'CLOSED';
    }

    await loan.save();

    return res.status(201).json({
      message: 'Payment successfully recorded.',
      payment: newPayment,
      loan
    });
  } catch (error: any) {
    console.error('Record payment error:', error);
    // Intercept Mongo Duplicate Key Error just in case of parallel race condition
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Duplicate Payment: UTR number has already been recorded.' });
    }
    return res.status(500).json({ error: 'Internal server error recording payment.' });
  }
};
