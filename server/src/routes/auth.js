import express from 'express';
import { syncUser, register, login, getAdminId, getDoctors } from '../controllers/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/sync', syncUser);
router.get('/admin-id', getAdminId);
router.get('/doctors', getDoctors);

export default router;
