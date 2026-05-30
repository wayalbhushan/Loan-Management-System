import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { User, UserRole } from '../models/User';
import { BorrowerProfile } from '../models/BorrowerProfile';
import { Loan } from '../models/Loan';
import { connectDB } from '../config/db';

dotenv.config();

// Helper to calculate total repayment amount
function calcRepayment(principal: number, tenureDays: number): number {
  const interestRate = 12;
  const simpleInterest = (principal * interestRate * tenureDays) / (365 * 100);
  const roundedInterest = Math.round(simpleInterest * 100) / 100;
  return principal + roundedInterest;
}

async function seed() {
  console.log('Connecting to MongoDB...');
  await connectDB();
  console.log('Connected successfully. Dropping database...');
  if (!mongoose.connection.db) {
    throw new Error('Database connection not established.');
  }
  await mongoose.connection.db.dropDatabase();
  console.log('Database dropped.');

  const passwordHash = await bcrypt.hash('Password@123', 10);

  // Operational Roles and standard Borrower
  const seedUsers = [
    {
      name: 'System Admin',
      email: 'admin@lms.com',
      passwordHash,
      role: 'ADMIN' as UserRole
    },
    {
      name: 'Sales Executive',
      email: 'sales@lms.com',
      passwordHash,
      role: 'SALES' as UserRole
    },
    {
      name: 'Sanction Officer',
      email: 'sanction@lms.com',
      passwordHash,
      role: 'SANCTION' as UserRole
    },
    {
      name: 'Disbursement Manager',
      email: 'disbursement@lms.com',
      passwordHash,
      role: 'DISBURSEMENT' as UserRole
    },
    {
      name: 'Collection Executive',
      email: 'collection@lms.com',
      passwordHash,
      role: 'COLLECTION' as UserRole
    },
    {
      name: 'Borrower Test (Sales Lead)',
      email: 'borrower@lms.com',
      passwordHash,
      role: 'BORROWER' as UserRole
    },
    {
      name: 'Borrower Applied',
      email: 'borrower_applied@lms.com',
      passwordHash,
      role: 'BORROWER' as UserRole
    },
    {
      name: 'Borrower Sanctioned',
      email: 'borrower_sanctioned@lms.com',
      passwordHash,
      role: 'BORROWER' as UserRole
    },
    {
      name: 'Borrower Disbursed',
      email: 'borrower_disbursed@lms.com',
      passwordHash,
      role: 'BORROWER' as UserRole
    }
  ];

  console.log('Seeding users...');
  const createdUsers = await User.insertMany(seedUsers);
  console.log(`Successfully created ${createdUsers.length} users.`);

  // Find the created users to link Profiles and Loans
  const userMap = new Map<string, mongoose.Types.ObjectId>();
  createdUsers.forEach(u => {
    userMap.set(u.email, u._id as mongoose.Types.ObjectId);
  });

  console.log('Seeding profiles and loans...');

  // 1. Borrower Applied
  const idApplied = userMap.get('borrower_applied@lms.com')!;
  const profileApplied = await BorrowerProfile.create({
    userId: idApplied,
    pan: 'APPLI1234E',
    dob: new Date('1990-01-01'),
    monthlySalary: 60000,
    employmentMode: 'SALARIED',
    salarySlipUrl: 'https://res.cloudinary.com/dvxkss7s3/raw/upload/v1780135800/lms-salary-slips/seeded-salary-slip-1.pdf'
  });
  await Loan.create({
    borrowerId: idApplied,
    principalAmount: 100000,
    tenureDays: 90,
    interestRate: 12,
    totalRepayment: calcRepayment(100000, 90),
    status: 'APPLIED',
    amountPaid: 0
  });

  // 2. Borrower Sanctioned
  const idSanctioned = userMap.get('borrower_sanctioned@lms.com')!;
  const profileSanctioned = await BorrowerProfile.create({
    userId: idSanctioned,
    pan: 'SANCT1234D',
    dob: new Date('1992-05-10'),
    monthlySalary: 75000,
    employmentMode: 'SALARIED',
    salarySlipUrl: 'https://res.cloudinary.com/dvxkss7s3/raw/upload/v1780135801/lms-salary-slips/seeded-salary-slip-2.pdf'
  });
  await Loan.create({
    borrowerId: idSanctioned,
    principalAmount: 150000,
    tenureDays: 120,
    interestRate: 12,
    totalRepayment: calcRepayment(150000, 120),
    status: 'SANCTIONED',
    amountPaid: 0
  });

  // 3. Borrower Disbursed
  const idDisbursed = userMap.get('borrower_disbursed@lms.com')!;
  const profileDisbursed = await BorrowerProfile.create({
    userId: idDisbursed,
    pan: 'DISBU1234C',
    dob: new Date('1988-11-20'),
    monthlySalary: 90000,
    employmentMode: 'SELF_EMPLOYED',
    salarySlipUrl: 'https://res.cloudinary.com/dvxkss7s3/raw/upload/v1780135802/lms-salary-slips/seeded-salary-slip-3.pdf'
  });
  await Loan.create({
    borrowerId: idDisbursed,
    principalAmount: 200000,
    tenureDays: 180,
    interestRate: 12,
    totalRepayment: calcRepayment(200000, 180),
    status: 'DISBURSED',
    amountPaid: 0
  });

  console.log('Seeding profiles and loans complete!');
  
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
}

seed().catch((err) => {
  console.error('Error seeding database:', err);
  process.exit(1);
});
