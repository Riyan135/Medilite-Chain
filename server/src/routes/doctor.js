import express from 'express';
import { searchPatients, getPatientDetailsForDoctor, addDoctorNote, getRecentConsultations, getPatientHealthOverview, updateDoctorSignature, getAllDoctorsForPatients } from '../controllers/doctor.js';
import { doctorOnly } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/patient/:id', doctorOnly, getPatientDetailsForDoctor);
router.post('/patient/:id/health-overview', doctorOnly, getPatientHealthOverview);
router.get('/recent', doctorOnly, getRecentConsultations);
router.get('/search', doctorOnly, searchPatients);
router.post('/notes', doctorOnly, addDoctorNote);
router.patch('/signature', doctorOnly, updateDoctorSignature);
router.get('/', getAllDoctorsForPatients);

export default router;
