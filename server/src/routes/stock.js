import express from 'express';
import { createStockTransaction, getStockTransactions } from '../controllers/medicineController.js';

const router = express.Router();

router.get('/', getStockTransactions);
router.post('/', createStockTransaction);

export default router;
