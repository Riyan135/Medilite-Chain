import express from 'express';
import { getInventory, addMedicine, updateStock, deleteMedicine } from '../controllers/inventoryController.js';

const router = express.Router();

router.get('/:patientId', getInventory);
router.post('/', addMedicine);
router.put('/:id', updateStock);
router.delete('/:id', deleteMedicine);

export default router;
