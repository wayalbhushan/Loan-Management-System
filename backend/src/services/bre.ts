export interface BRERequest {
  dob: Date | string;
  monthlySalary: number;
  pan: string;
  employmentMode: string;
}

export interface BREResult {
  passed: boolean;
  reason?: string;
}

export const evaluateBRE = (profile: BRERequest): BREResult => {
  // 1. PAN validation
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!panRegex.test(profile.pan.trim().toUpperCase())) {
    return { passed: false, reason: 'Invalid PAN format. Must match standard Indian PAN pattern.' };
  }

  // 2. Age validation (23-50 inclusive)
  const today = new Date();
  const birthDate = new Date(profile.dob);
  if (isNaN(birthDate.getTime())) {
    return { passed: false, reason: 'Invalid date of birth supplied.' };
  }
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < 23 || age > 50) {
    return { passed: false, reason: `Borrower age must be between 23 and 50. Calculated age is ${age}.` };
  }

  // 3. Salary validation (>= 25,000)
  if (profile.monthlySalary < 25000) {
    return { passed: false, reason: `Monthly salary must be at least 25,000. Provided: ${profile.monthlySalary}.` };
  }

  // 4. Employment mode validation (not UNEMPLOYED)
  if (profile.employmentMode.toUpperCase() === 'UNEMPLOYED') {
    return { passed: false, reason: 'Unemployed individuals are not eligible for a loan.' };
  }

  return { passed: true };
};
