import express from 'express';
import {
  syncUser,
  register,
  verifyRegisterOtp,
  login,
  logout,
  staffLogin,
  requestOtp,
  verifyOtp,
  requestStaffOtp,
  verifyStaffOtp,
  loginDoctorWithId,
  requestDoctorOtp,
  verifyDoctorOtp,
  requestDoctorSignupOtp,
  verifyDoctorSignupOtp,
  getAdminId,
  getDoctors,
  getCurrentUser,
} from '../controllers/auth.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/register/verify-otp', verifyRegisterOtp);
router.post('/login', login);
router.post('/logout', logout);
router.post('/staff-login', staffLogin);
router.post('/staff-request-otp', requestStaffOtp);
router.post('/staff-verify-otp', verifyStaffOtp);
router.post('/doctor/login', loginDoctorWithId);
router.post('/doctor/request-otp', requestDoctorOtp);
router.post('/doctor/verify-otp', verifyDoctorOtp);
router.post('/doctor/sign-up/request-otp', requestDoctorSignupOtp);
router.post('/doctor/sign-up/verify-otp', verifyDoctorSignupOtp);
router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);
router.post('/sync', syncUser);
router.get('/me', authMiddleware, getCurrentUser);
router.get('/admin-id', getAdminId);
router.get('/doctors', getDoctors);

export default router;
