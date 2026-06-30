# Loan Management System (LMS)

A premium, secure end-to-end lending platform where Borrowers can apply for loans through a multi-step eligibility wizard, and internal executives manage those loans through their lifecycle stages (Sales Lead, Sanction Review, Disbursement Payout, and Active Collection).

---
# LIVE DEMO LINK : https://youtu.be/h6Tphs61cro

  ## 📸 Project Interface

<p align="center">
  <img src="Screenshot%202026-06-30%20103543.png" width="800">
</p>

<p align="center">
  <img src="Screenshot%202026-06-30%20103557.png" width="800">
</p>

<p align="center">
  <img src="Screenshot%202026-06-30%20103616.png" width="800">
</p>

<p align="center">
  <img src="Screenshot%202026-06-30%20103631.png" width="800">
</p>

<p align="center">
  <img src="Screenshot%202026-06-30%20103652.png" width="800">
</p>

## 🚀 Tech Stack

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS + Axios + Lucide Icons + Sonner (Toasts)
- **Backend:** Node.js + Express.js + TypeScript + Multer
- **Database:** MongoDB + Mongoose
- **Storage:** Cloudinary (For uploading borrower salary slips securely as raw PDFs or images)
- **Security:** JWT Authentication + bcrypt Password Hashing

---

## 🔑 Login Credentials (Pre-Seeded)

The system is seeded with a set of default accounts to make testing immediate and seamless for the evaluator.
All accounts share the same password: **`Password@123`**

| Role | Email Address | Purpose & State |
| :--- | :--- | :--- |
| **Admin** | `admin@lms.com` | Has access to all 4 Dashboard modules. |
| **Sales** | `sales@lms.com` | Handles leads (registered borrowers without active loans). |
| **Sanction** | `sanction@lms.com` | Approves or Rejects applied loans in the queue. |
| **Disbursement** | `disbursement@lms.com` | Marks sanctioned loans as paid out/disbursed. |
| **Collection** | `collection@lms.com` | Logs borrower repayment transactions by UTR. |
| **Borrower (Lead)** | `borrower@lms.com` | A registered borrower who has not applied yet. |
| **Borrower (Applied)** | `borrower_applied@lms.com` | Borrower who has submitted a loan request (status: `APPLIED`). |
| **Borrower (Sanctioned)**| `borrower_sanctioned@lms.com`| Borrower whose loan has been approved (status: `SANCTIONED`). |
| **Borrower (Disbursed)** | `borrower_disbursed@lms.com`| Borrower with active loan funds released (status: `DISBURSED`). |

---

## 🏗️ Folder Structure

```text
Loan Management System/
├── backend/
│   ├── src/
│   │   ├── config/       # DB and Cloudinary setup configs
│   │   ├── controllers/  # Business logic for auth, borrower and operations dashboards
│   │   ├── middleware/   # JWT authentication & RBAC guards
│   │   ├── models/       # Mongoose schemas (User, BorrowerProfile, Loan, Payment)
│   │   ├── routes/       # Express route handlers
│   │   ├── services/     # BRE logic and Cloudinary stream upload helpers
│   │   ├── scripts/      # Database drop & seed script
│   │   └── index.ts      # Server entry point
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/        # Login & Register views
│   │   │   ├── (borrower)/    # Multi-step Borrower Portal wizard & dashboard
│   │   │   ├── dashboard/     # Operations Console modules (Sales, Sanction, etc.)
│   │   │   ├── globals.css    # Global styling overrides
│   │   │   ├── layout.tsx     # Root Next.js layout configuration
│   │   │   └── page.tsx       # Auth status router
│   │   ├── components/        # Table skeletal loaders and premium reusable assets
│   │   ├── context/           # Auth provider handling sessions and token storage
│   │   ├── lib/               # Axios API client wrapper
│   │   └── middleware.ts      # Frontend Next.js router role guards
│   ├── scripts/               # E2E flow testing scripts
│   ├── package.json
│   └── tailwind.config.ts
```

---

## ⚙️ Local Setup Instructions

### 1. Prerequisites
Ensure you have **Node.js (v18+)** and **npm** installed on your system.

### 2. Backend Configuration
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
   *(The default `.env.example` file is already populated with connection strings for a MongoDB Atlas sandbox and Cloudinary credentials so you can start testing immediately!)*
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the seed script to clean the database and create default users/profiles:
   ```bash
   npm run seed
   ```
5. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend will start running at `http://localhost:5000`.

### 3. Frontend Configuration
1. Navigate to the `frontend` folder:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   The frontend console will start running at `http://localhost:3000`.

---

## ⚖️ Business Rules Engine (BRE) & Loan Math

### 1. Verification Rules (Server & Client Side)
Applicants must pass the following rules to apply for a loan:
- **Age limit:** Must be between **23 and 50** years old.
- **Salary threshold:** Minimum monthly income of **₹25,000**.
- **Employment status:** Must be **Salaried** or **Self-Employed**. Applications with `Unemployed` are rejected.
- **PAN Verification:** Verified against the standard regex: `/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/`.

### 2. Interest Rate & Repayment Math
Interest is calculated using the **Simple Interest** formula:
$$\text{Simple Interest (SI)} = \frac{P \times R \times T}{365 \times 100}$$
- **$P$:** Principal Amount (₹50,000 - ₹500,000)
- **$R$:** Annual Interest Rate (Fixed at **12% p.a.**)
- **$T$:** Tenure (30 - 365 Days)
- **Total Repayment Amount:** $P + \text{SI}$ (rounded to 2 decimal places).

---

## 🛡️ Role-Based Access Control (RBAC)

RBAC is strictly enforced on **both** the frontend and the backend.

- **Backend Enforcement:** The `requireRole` middleware checks the decoded token payload and returns a `403 Forbidden` response if the role does not have authorization for that route.
- **Frontend Enforcement:** 
  - The sidebar navigation and operational dashboards only render items authorized for the user's role.
  - Next.js middleware guards prevent cross-access by intercepting URL navigations and redirecting unauthorized users back to `/dashboard` or `/login`.

---

## 📡 REST API Design

### Authentication
- `POST /api/auth/register` — Registers a borrower account.
- `POST /api/auth/login` — Sign in to get JWT token.

### Borrower Portal
- `GET /api/borrower/me` — Fetches borrower's active profile and current loan details.
- `POST /api/borrower/profile` — Submits personal details + salary slip file (BRE check runs here).
- `PUT /api/borrower/profile` — Modifies borrower profile details (disallowed if loan is active).
- `POST /api/borrower/loan` — Submits a loan application request (requires a completed profile).

### Operations Dashboard
- `GET /api/dashboard/sales` — List leads (registered borrowers with no loans).
- `GET /api/dashboard/sanction` — List applied loans.
- `PUT /api/dashboard/sanction/:id` — Approve or Reject a loan request.
- `GET /api/dashboard/disbursement` — List approved loans.
- `PUT /api/dashboard/disbursement/:id` — Mark a loan as disbursed (releases funds).
- `GET /api/dashboard/collection` — List disbursed active loans.
- `POST /api/dashboard/collection/:id/payment` — Record repayment amount by UTR (UTR must be unique; auto-closes loan once outstanding is zero).

---

## 🌐 Vercel Monorepo Hosting Instructions

Both the frontend and backend can be hosted together on **Vercel** as a monorepo setup:

### 1. Backend Serverless API Setup
1. In the Vercel dashboard, click **Add New > Project** and import this repository.
2. Configure the project:
   - **Name:** `lms-backend-api`
   - **Framework Preset:** `Other` (detected as standard Node web application)
   - **Root Directory:** `backend`
3. Add the following **Environment Variables** under Project Settings:
   - `MONGO_URI`: (Your MongoDB Atlas connection string)
   - `JWT_SECRET`: (Your JWT secret string)
   - `JWT_EXPIRES_IN`: `7d`
   - `CLOUDINARY_CLOUD_NAME`: `cloud`
   - `CLOUDINARY_API_KEY`: `api_key`
   - `CLOUDINARY_API_SECRET`: `f_vAymXw`
4. Click **Deploy**. Vercel will build and host your serverless API (e.g., `https://lms-backend-api.vercel.app`).

### 2. Frontend Next.js Portal Setup
1. In the Vercel dashboard, click **Add New > Project** and import this repository again.
2. Configure the project:
   - **Name:** `lms-frontend-portal`
   - **Framework Preset:** `Next.js` (automatically detected)
   - **Root Directory:** `frontend`
3. Add the following **Environment Variable** under Project Settings:
   - `NEXT_PUBLIC_API_URL`: Set this to your deployed backend URL with `/api` path (e.g., `https://lms-backend-api.vercel.app/api`).
4. Click **Deploy**. Vercel will compile and host your frontend Next.js App Router application (e.g., `https://lms-frontend-portal.vercel.app`).

---

## 🧪 Running Automated E2E Checks
The project includes a command-line flow test verifying all state transitions. Run:
```bash
cd frontend
node scripts/verify-flow.js
```
The script logs in as a borrower, creates a profile, applies for a loan, logs in as sanction officer to approve, disburse officer to release funds, and collections executive to record payment and auto-close the loan.
