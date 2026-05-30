const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function run() {
  console.log('\x1b[36m%s\x1b[0m', '--- STARTING E2E FLOW VERIFICATION SCRIPT ---');

  const client = (token) => axios.create({
    baseURL: BASE_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });

  // Step 1: Login as Borrower & Apply for Loan
  console.log('\n[1] Logging in as borrower@lms.com...');
  let borrowerToken, borrowerId;
  try {
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'borrower@lms.com',
      password: 'Password@123'
    });
    borrowerToken = loginRes.data.token;
    borrowerId = loginRes.data.user.id;
    console.log('\x1b[32m%s\x1b[0m', `✔ Logged in as borrower: ${loginRes.data.user.name}`);
  } catch (err) {
    console.error('\x1b[31m%s\x1b[0m', '✖ Borrower login failed:', err.response?.data || err.message);
    process.exit(1);
  }

  const borrowerClient = client(borrowerToken);

  // Check if Borrower Profile exists; if not, create one
  console.log('Checking borrower profile status...');
  let hasProfile = false;
  try {
    // Attempt to submit profile
    const formData = new FormData();
    formData.append('pan', 'ABCDE1234F');
    formData.append('dob', '1995-05-15');
    formData.append('monthlySalary', '40000');
    formData.append('employmentMode', 'SALARIED');

    const fileBlob = new Blob(['dummy salary proof content'], { type: 'text/plain' });
    formData.append('salarySlip', fileBlob, 'slip.txt');

    await borrowerClient.post('/borrower/profile', formData);
    console.log('\x1b[32m%s\x1b[0m', '✔ Borrower Profile successfully configured (BRE Checked).');
  } catch (err) {
    const errMsg = err.response?.data?.error || '';
    if (errMsg.includes('already exists')) {
      console.log('✔ Borrower Profile already configured. Proceeding...');
    } else {
      console.error('\x1b[31m%s\x1b[0m', '✖ Profile configuration failed:', err.response?.data || err.message);
      process.exit(1);
    }
  }

  // Submit Loan Application
  console.log('Submitting loan application...');
  let loanId, totalRepayment;
  try {
    const loanRes = await borrowerClient.post('/borrower/loan', {
      principalAmount: 100000,
      tenureDays: 90
    });
    loanId = loanRes.data.loan._id;
    totalRepayment = loanRes.data.loan.totalRepayment;
    console.log('\x1b[32m%s\x1b[0m', `✔ Loan applied. ID: ${loanId}. Principal: ₹100,000, Total Repayable: ₹${totalRepayment}`);
  } catch (err) {
    console.error('\x1b[31m%s\x1b[0m', '✖ Loan application failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // Step 2: Login as Sanction Officer & Approve Loan
  console.log('\n[2] Sanctioning Loan (Sanction Officer login)...');
  let sanctionToken;
  try {
    const sanctionLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'sanction@lms.com',
      password: 'Password@123'
    });
    sanctionToken = sanctionLogin.data.token;
    console.log('\x1b[32m%s\x1b[0m', `✔ Logged in as Sanction Officer: ${sanctionLogin.data.user.name}`);
  } catch (err) {
    console.error('\x1b[31m%s\x1b[0m', '✖ Sanction login failed:', err.response?.data || err.message);
    process.exit(1);
  }

  const sanctionClient = client(sanctionToken);
  try {
    const sanctionRes = await sanctionClient.put(`/dashboard/sanction/${loanId}`, {
      status: 'SANCTIONED'
    });
    console.log('\x1b[32m%s\x1b[0m', `✔ Loan Approved (SANCTIONED). Status: ${sanctionRes.data.loan.status}`);
  } catch (err) {
    console.error('\x1b[31m%s\x1b[0m', '✖ Sanction approval failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // Step 3: Login as Disbursement Manager & Payout Loan
  console.log('\n[3] Disbursing Loan (Disbursement Manager login)...');
  let disburseToken;
  try {
    const disburseLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'disbursement@lms.com',
      password: 'Password@123'
    });
    disburseToken = disburseLogin.data.token;
    console.log('\x1b[32m%s\x1b[0m', `✔ Logged in as Disbursement Manager: ${disburseLogin.data.user.name}`);
  } catch (err) {
    console.error('\x1b[31m%s\x1b[0m', '✖ Disbursement login failed:', err.response?.data || err.message);
    process.exit(1);
  }

  const disburseClient = client(disburseToken);
  try {
    const disburseRes = await disburseClient.put(`/dashboard/disbursement/${loanId}`);
    console.log('\x1b[32m%s\x1b[0m', `✔ Loan Disbursed (DISBURSED). Status: ${disburseRes.data.loan.status}`);
  } catch (err) {
    console.error('\x1b[31m%s\x1b[0m', '✖ Disbursement failed:', err.response?.data || err.message);
    process.exit(1);
  }

  // Step 4: Login as Collection Executive & Pay off/Close Loan
  console.log('\n[4] Settle Repayment & Closing Loan (Collection Executive login)...');
  let collectionToken;
  try {
    const collectionLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'collection@lms.com',
      password: 'Password@123'
    });
    collectionToken = collectionLogin.data.token;
    console.log('\x1b[32m%s\x1b[0m', `✔ Logged in as Collection Executive: ${collectionLogin.data.user.name}`);
  } catch (err) {
    console.error('\x1b[31m%s\x1b[0m', '✖ Collection login failed:', err.response?.data || err.message);
    process.exit(1);
  }

  const collectionClient = client(collectionToken);
  try {
    const utrNumber = `UTR${Date.now()}`;
    const paymentRes = await collectionClient.post(`/dashboard/collection/${loanId}/payment`, {
      utrNumber,
      amount: totalRepayment
    });
    console.log('\x1b[32m%s\x1b[0m', `✔ Payment of ₹${totalRepayment} recorded successfully (UTR: ${utrNumber}).`);
    console.log('\x1b[32m%s\x1b[0m', `✔ Expected Status: CLOSED. Actual Status: ${paymentRes.data.loan.status}`);

    if (paymentRes.data.loan.status === 'CLOSED') {
      console.log('\n\x1b[42m\x1b[30m%s\x1b[0m', ' 🎉 SUCCESS: E2E STATE MACHINE FLOW COMPLETED WITHOUT ISSUES! ');
    } else {
      console.error('\x1b[31m%s\x1b[0m', `✖ FAILED: Loan status is ${paymentRes.data.loan.status} (expected CLOSED).`);
      process.exit(1);
    }
  } catch (err) {
    console.error('\x1b[31m%s\x1b[0m', '✖ Repayment recording failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

run();
