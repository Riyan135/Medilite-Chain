import express from 'express';
import { 
  getDoctors, 
  createAppointment, 
  updateAppointmentStatus, 
  getDoctorPendingAppointments 
} from '../controllers/appointmentController.js';

const router = express.Router();

router.get('/doctors', getDoctors);
router.post('/book', createAppointment);
router.get('/pending', getDoctorPendingAppointments);
router.patch('/:id/status', updateAppointmentStatus);

export default router;
