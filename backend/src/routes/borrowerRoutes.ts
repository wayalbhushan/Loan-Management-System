import { Router } from 'express';
import multer from 'multer';
import { createProfile, applyLoan, getBorrowerData, updateProfile } from '../controllers/borrower';
import { authenticateJWT } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Protect borrower routes
router.use(authenticateJWT);
router.use(requireRole(['BORROWER']));

router.get('/me', getBorrowerData);
router.post('/profile', upload.single('salarySlip'), createProfile);
router.put('/profile', upload.single('salarySlip'), updateProfile);
router.post('/loan', applyLoan);

export default router;
