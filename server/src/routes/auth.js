import express from 'express';
import { syncUser, register, login, staffLogin, requestOtp, verifyOtp, requestStaffOtp, verifyStaffOtp, getAdminId, getDoctors } from '../controllers/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/staff-login', staffLogin);
router.post('/staff-request-otp', requestStaffOtp);
router.post('/staff-verify-otp', verifyStaffOtp);
router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);
router.post('/sync', syncUser);
router.get('/admin-id', getAdminId);
router.get('/doctors', getDoctors);

export default router;
