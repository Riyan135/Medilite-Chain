import express from 'express';
import { getAllPatients, getPatientDetails, assignDoctor, getAllDoctors } from '../controllers/adminController.js';

const router = express.Router();

router.get('/patients', getAllPatients);
router.get('/patients/:id', getPatientDetails);
router.post('/assign-doctor', assignDoctor);
router.get('/doctors', getAllDoctors);

export default router;
