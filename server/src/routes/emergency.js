import express from 'express';
import { activateEmergency, getHospitals, bookAmbulance } from '../controllers/emergencyController.js';

const router = express.Router();

router.post('/activate', activateEmergency);
router.get('/hospitals', getHospitals);
router.post('/book', bookAmbulance);

export default router;
