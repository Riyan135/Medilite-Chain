import express from 'express';
import { uploadRecord, getPatientRecords, deleteRecord, summarizeRecord, generateRecordQR, getHealthOverview } from '../controllers/records.js';

import { handleCloudinaryUploadError, upload } from '../utils/cloudinary.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Upload a new medical record
router.post('/upload', upload.single('file'), handleCloudinaryUploadError, uploadRecord);

// Get all records for a patient
router.get('/patient/:patientId', getPatientRecords);
router.delete('/:id', deleteRecord);

// AI & QR Features
router.post('/health-overview', getHealthOverview);
router.post('/:id/summarize', summarizeRecord);
router.get('/:id/qr', generateRecordQR);


export default router;

