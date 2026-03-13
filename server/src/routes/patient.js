import express from 'express';
import { getPatientProfile, updatePatientProfile, getDashboardStats } from '../controllers/patient.js';

const router = express.Router();

router.get('/profile/:id', getPatientProfile);
router.put('/profile/:id', updatePatientProfile);
router.get('/stats/:id', getDashboardStats);

export default router;
