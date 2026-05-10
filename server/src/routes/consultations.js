import express from 'express';
import {
  addPrescription,
  createConsultation,
  downloadPrescriptionPdf,
  getConsultationById,
  getConsultationStats,
  getConsultations,
  updateConsultation,
} from '../controllers/consultationController.js';

const router = express.Router();

router.post('/', createConsultation);
router.get('/', getConsultations);
router.get('/stats', getConsultationStats);
router.get('/:id/prescription.pdf', downloadPrescriptionPdf);
router.get('/:id', getConsultationById);
router.patch('/:id', updateConsultation);
router.post('/:id/prescription', addPrescription);

export default router;
