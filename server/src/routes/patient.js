import express from 'express';
import { getPatientProfile, updatePatientProfile, getDashboardStats, uploadProfilePicture, updateUserBasicInfo } from '../controllers/patient.js';
import { handleCloudinaryUploadError, uploadProfileImage } from '../utils/cloudinary.js';

const router = express.Router();

router.get('/profile/:id', getPatientProfile);
router.put('/profile/:id', updatePatientProfile);
router.put('/users/:id', updateUserBasicInfo);
router.post('/profile-picture/:id', uploadProfileImage.single('profileImage'), handleCloudinaryUploadError, uploadProfilePicture);
router.get('/stats/:id', getDashboardStats);

export default router;
