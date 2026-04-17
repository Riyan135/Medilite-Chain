import { getSystemStats, getAllUsers, deleteUser, approveDoctor, createDoctorAccount } from '../controllers/admin.js';
import { getAllPatients, getPatientDetails, assignDoctor, getAllDoctors } from '../controllers/adminController.js';
import express from 'express';

const router = express.Router();

router.get('/stats', getSystemStats);
router.get('/users', getAllUsers);
router.patch('/user/:id/approve', approveDoctor);
router.delete('/user/:id', deleteUser);

// New Admin functionality
router.get('/patients', getAllPatients);
router.get('/patients/:id', getPatientDetails);
router.post('/assign-doctor', assignDoctor);
router.get('/doctors', getAllDoctors);
router.post('/doctors', createDoctorAccount);

export default router;
