import express from 'express';
import { searchPatients, getPatientDetailsForDoctor, addDoctorNote, getRecentConsultations, getPatientHealthOverview, updateDoctorSignature } from '../controllers/doctor.js';

const router = express.Router();

router.get('/search', searchPatients);
router.get('/recent', getRecentConsultations);
router.get('/patient/:id', getPatientDetailsForDoctor);
router.post('/patient/:id/health-overview', getPatientHealthOverview);
router.patch('/signature', updateDoctorSignature);
router.post('/notes', addDoctorNote);

export default router;
