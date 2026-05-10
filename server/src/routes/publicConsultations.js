import express from 'express';
import { downloadSharedPrescriptionPdf } from '../controllers/consultationController.js';

const router = express.Router();

router.get('/:id/prescription/:token.pdf', downloadSharedPrescriptionPdf);

export default router;
