import express from 'express';
import {
  addMedicineStock,
  createStockTransaction,
  deleteMedicineStock,
  getMedicines,
  getMedicineStats,
  getStockTransactions,
  updateMedicine,
} from '../controllers/medicineController.js';

const router = express.Router();

router.get('/', getMedicines);
router.post('/', addMedicineStock);
router.get('/stats', getMedicineStats);
router.put('/:id', updateMedicine);
router.delete('/:id', deleteMedicineStock);
router.get('/transactions/all', getStockTransactions);
router.post('/stock', createStockTransaction);

export default router;
