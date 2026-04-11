import express from 'express';
import { 
  getDoctors, 
  createAppointment, 
  updateAppointmentStatus, 
  getDoctorPendingAppointments,
  getAppointmentById,
  getAppointmentHistory,
  deleteAppointment,
} from '../controllers/appointmentController.js';

const router = express.Router();

router.get('/doctors', getDoctors);
router.post('/book', createAppointment);
router.get('/pending', getDoctorPendingAppointments);
router.get('/history', getAppointmentHistory);
router.get('/:id', getAppointmentById);
router.patch('/:id/status', updateAppointmentStatus);
router.delete('/:id', deleteAppointment);

export default router;
