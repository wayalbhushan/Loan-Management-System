import mongoose, { Schema, Document } from 'mongoose';

export type LoanStatus = 'DRAFT' | 'APPLIED' | 'SANCTIONED' | 'REJECTED' | 'DISBURSED' | 'CLOSED';

export interface ILoan extends Document {
  borrowerId: mongoose.Types.ObjectId;
  principalAmount: number;
  tenureDays: number;
  interestRate: number;
  totalRepayment: number;
  status: LoanStatus;
  rejectionReason?: string;
  amountPaid: number;
  createdAt: Date;
  updatedAt: Date;
}

const LoanSchema: Schema = new Schema<ILoan>({
  borrowerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  principalAmount: {
    type: Number,
    required: true,
    min: [50000, 'Principal amount must be at least 50,000'],
    max: [500000, 'Principal amount cannot exceed 500,000']
  },
  tenureDays: {
    type: Number,
    required: true,
    min: [30, 'Tenure must be at least 30 days'],
    max: [365, 'Tenure cannot exceed 365 days']
  },
  interestRate: { type: Number, default: 12 },
  totalRepayment: { type: Number, required: true },
  status: {
    type: String,
    enum: ['DRAFT', 'APPLIED', 'SANCTIONED', 'REJECTED', 'DISBURSED', 'CLOSED'],
    default: 'DRAFT'
  },
  rejectionReason: {
    type: String,
    required: function(this: ILoan) {
      return this.status === 'REJECTED';
    }
  },
  amountPaid: { type: Number, default: 0 }
}, {
  timestamps: true
});

export const Loan = mongoose.model<ILoan>('Loan', LoanSchema);
