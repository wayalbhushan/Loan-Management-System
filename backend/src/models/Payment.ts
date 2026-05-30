import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  loanId: mongoose.Types.ObjectId;
  utrNumber: string;
  amount: number;
  paymentDate: Date;
  recordedBy: mongoose.Types.ObjectId;
}

const PaymentSchema: Schema = new Schema<IPayment>({
  loanId: { type: Schema.Types.ObjectId, ref: 'Loan', required: true },
  utrNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
  amount: { type: Number, required: true, min: [1, 'Payment amount must be greater than 0'] },
  paymentDate: { type: Date, default: Date.now },
  recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
