import { getSystemStats, getAllUsers, deleteUser, approveDoctor, toggleBlockUser, toggleFlagUser } from '../controllers/admin.js';
import { getAllPatients, getPatientDetails, assignDoctor, getAllDoctors } from '../controllers/adminController.js';
import express from 'express';

const router = express.Router();

router.get('/stats', getSystemStats);
router.get('/users', getAllUsers);
router.patch('/user/:id/approve', approveDoctor);
router.patch('/user/:id/block', toggleBlockUser);
router.patch('/user/:id/flag', toggleFlagUser);
router.delete('/user/:id', deleteUser);

// New Admin functionality
router.get('/patients', getAllPatients);
router.get('/patients/:id', getPatientDetails);
router.post('/assign-doctor', assignDoctor);
router.get('/doctors', getAllDoctors);

export default router;
