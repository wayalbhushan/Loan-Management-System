import { Router } from 'express';
import {
  getSalesLeads,
  getAppliedLoans,
  updateSanctionState,
  getSanctionedLoans,
  updateDisburseState,
  getDisbursedLoans,
  recordPayment
} from '../controllers/dashboard';
import { authenticateJWT } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

// Protect all dashboard routes
router.use(authenticateJWT);

// Sales leads
router.get('/sales', requireRole(['SALES', 'ADMIN']), getSalesLeads);

// Sanction
router.get('/sanction', requireRole(['SANCTION', 'ADMIN']), getAppliedLoans);
router.put('/sanction/:id', requireRole(['SANCTION', 'ADMIN']), updateSanctionState);

// Disbursement
router.get('/disbursement', requireRole(['DISBURSEMENT', 'ADMIN']), getSanctionedLoans);
router.put('/disbursement/:id', requireRole(['DISBURSEMENT', 'ADMIN']), updateDisburseState);

// Collection
router.get('/collection', requireRole(['COLLECTION', 'ADMIN']), getDisbursedLoans);
router.post('/collection/:id/payment', requireRole(['COLLECTION', 'ADMIN']), recordPayment);

export default router;
