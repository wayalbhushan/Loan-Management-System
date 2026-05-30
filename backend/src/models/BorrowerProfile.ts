import mongoose, { Schema, Document } from 'mongoose';

export type EmploymentMode = 'SALARIED' | 'SELF_EMPLOYED' | 'UNEMPLOYED';

export interface IBorrowerProfile extends Document {
  userId: mongoose.Types.ObjectId;
  pan: string;
  dob: Date;
  monthlySalary: number;
  employmentMode: EmploymentMode;
  salarySlipUrl: string;
}

const BorrowerProfileSchema: Schema = new Schema<IBorrowerProfile>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  pan: { type: String, required: true, uppercase: true, trim: true },
  dob: { type: Date, required: true },
  monthlySalary: { type: Number, required: true },
  employmentMode: {
    type: String,
    enum: ['SALARIED', 'SELF_EMPLOYED', 'UNEMPLOYED'],
    required: true
  },
  salarySlipUrl: { type: String, required: true }
});

export const BorrowerProfile = mongoose.model<IBorrowerProfile>('BorrowerProfile', BorrowerProfileSchema);
