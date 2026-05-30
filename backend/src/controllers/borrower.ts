import { Request, Response } from 'express';
import { BorrowerProfile } from '../models/BorrowerProfile';
import { Loan } from '../models/Loan';
import { evaluateBRE } from '../services/bre';
import { uploadToCloudinary } from '../services/cloudinary';

export const createProfile = async (req: Request, res: Response) => {
  try {
    const { pan, dob, monthlySalary, employmentMode } = req.body;
    const file = req.file;

    if (!pan || !dob || !monthlySalary || !employmentMode) {
      return res.status(400).json({ error: 'All profile fields (pan, dob, monthlySalary, employmentMode) are required.' });
    }

    if (!file) {
      return res.status(400).json({ error: 'Salary slip file is required.' });
    }

    const salaryNumber = Number(monthlySalary);
    if (isNaN(salaryNumber)) {
      return res.status(400).json({ error: 'Monthly salary must be a valid number.' });
    }

    // 1. Run Business Rules Engine (BRE)
    const breResult = evaluateBRE({
      dob,
      monthlySalary: salaryNumber,
      pan,
      employmentMode
    });

    if (!breResult.passed) {
      return res.status(400).json({
        error: 'Business Rules Engine (BRE) validation failed.',
        reason: breResult.reason
      });
    }

    // Check if profile already exists for this user
    const existingProfile = await BorrowerProfile.findOne({ userId: req.user?.id });
    if (existingProfile) {
      return res.status(400).json({ error: 'Borrower profile already exists for this user.' });
    }

    let salarySlipUrl = '';
    try {
      salarySlipUrl = await uploadToCloudinary(file.buffer, 'lms-salary-slips', file.originalname);
    } catch (uploadError: any) {
      console.error('Cloudinary upload failure:', uploadError);
      return res.status(500).json({ error: 'Failed to upload salary slip to cloud storage. Please try again.' });
    }

    // 3. Save BorrowerProfile
    const profile = await BorrowerProfile.create({
      userId: req.user?.id,
      pan: pan.trim().toUpperCase(),
      dob: new Date(dob),
      monthlySalary: salaryNumber,
      employmentMode: employmentMode.toUpperCase(),
      salarySlipUrl
    });

    return res.status(201).json({
      message: 'Borrower profile created successfully',
      profile
    });
  } catch (error: any) {
    console.error('Create profile error:', error);
    return res.status(500).json({ error: 'Internal server error during profile creation.' });
  }
};

export const applyLoan = async (req: Request, res: Response) => {
  try {
    const { principalAmount, tenureDays } = req.body;

    if (!principalAmount || !tenureDays) {
      return res.status(400).json({ error: 'Principal amount and tenure in days are required.' });
    }

    const principal = Number(principalAmount);
    const tenure = Number(tenureDays);

    if (isNaN(principal) || principal < 50000 || principal > 500000) {
      return res.status(400).json({ error: 'Principal amount must be a number between 50,000 and 500,000.' });
    }

    if (isNaN(tenure) || tenure < 30 || tenure > 365) {
      return res.status(400).json({ error: 'Tenure must be a number between 30 and 365 days.' });
    }

    // Check if user has completed their profile
    const profile = await BorrowerProfile.findOne({ userId: req.user?.id });
    if (!profile) {
      return res.status(400).json({ error: 'Borrower profile not found. Please complete your profile first.' });
    }

    // Check if borrower already has an active (non-closed) loan
    const activeLoan = await Loan.findOne({
      borrowerId: req.user?.id,
      status: { $ne: 'CLOSED' }
    });
    if (activeLoan) {
      return res.status(400).json({ error: 'You already have an active loan. You cannot apply for a new one until it is CLOSED.' });
    }

    // Math: Simple Interest Formula: SI = (P * R * T) / (365 * 100) where R is 12% default
    const interestRate = 12;
    const simpleInterest = (principal * interestRate * tenure) / (365 * 100);
    // Round to 2 decimal places to ensure math accuracy
    const roundedInterest = Math.round(simpleInterest * 100) / 100;
    const totalRepayment = principal + roundedInterest;

    const newLoan = await Loan.create({
      borrowerId: req.user?.id,
      principalAmount: principal,
      tenureDays: tenure,
      interestRate,
      totalRepayment,
      status: 'APPLIED',
      amountPaid: 0
    });

    return res.status(201).json({
      message: 'Loan application submitted successfully.',
      loan: newLoan
    });
  } catch (error: any) {
    console.error('Apply loan error:', error);
    return res.status(500).json({ error: 'Internal server error during loan application.' });
  }
};

export const getBorrowerData = async (req: Request, res: Response) => {
  try {
    const profile = await BorrowerProfile.findOne({ userId: req.user?.id });
    const loan = await Loan.findOne({ borrowerId: req.user?.id });
    return res.status(200).json({ profile, loan });
  } catch (error: any) {
    console.error('Get borrower data error:', error);
    return res.status(500).json({ error: 'Internal server error fetching borrower data.' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { pan, dob, monthlySalary, employmentMode } = req.body;
    const file = req.file;

    // Check if the user has an active loan that is approved or disbursed.
    // If so, we prevent edits.
    const activeLoan = await Loan.findOne({
      borrowerId: req.user?.id,
      status: { $in: ['SANCTIONED', 'DISBURSED'] }
    });
    if (activeLoan) {
      return res.status(400).json({ error: 'You cannot update your profile because you have an active approved or disbursed loan.' });
    }

    const profile = await BorrowerProfile.findOne({ userId: req.user?.id });
    if (!profile) {
      return res.status(404).json({ error: 'Borrower profile not found.' });
    }

    if (pan) profile.pan = pan.trim().toUpperCase();
    if (dob) profile.dob = new Date(dob);
    if (monthlySalary) {
      const salaryNumber = Number(monthlySalary);
      if (isNaN(salaryNumber) || salaryNumber < 25000) {
        return res.status(400).json({ error: 'Monthly salary must be a number greater than or equal to 25,000.' });
      }
      profile.monthlySalary = salaryNumber;
    }
    if (employmentMode) {
      if (employmentMode === 'UNEMPLOYED') {
        return res.status(400).json({ error: 'Unemployed mode is not eligible for loans.' });
      }
      profile.employmentMode = employmentMode.toUpperCase();
    }

    if (file) {
      try {
        const salarySlipUrl = await uploadToCloudinary(file.buffer, 'lms-salary-slips', file.originalname);
        profile.salarySlipUrl = salarySlipUrl;
      } catch (uploadError: any) {
        console.error('Cloudinary upload failure:', uploadError);
        return res.status(500).json({ error: 'Failed to upload salary slip to cloud storage. Please try again.' });
      }
    }

    // Run Business Rules Engine (BRE) validations on updated fields
    const breResult = evaluateBRE({
      dob: profile.dob.toISOString().split('T')[0],
      monthlySalary: profile.monthlySalary,
      pan: profile.pan,
      employmentMode: profile.employmentMode
    });

    if (!breResult.passed) {
      return res.status(400).json({
        error: 'Business Rules Engine (BRE) validation failed.',
        reason: breResult.reason
      });
    }

    await profile.save();

    return res.status(200).json({
      message: 'Profile updated successfully',
      profile
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Internal server error during profile update.' });
  }
};
