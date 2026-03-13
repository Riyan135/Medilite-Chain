import express from 'express';
import { createReminder, getReminders, deleteReminder, toggleReminder } from '../controllers/reminders.js';

const router = express.Router();

router.post('/', createReminder);
router.get('/:id', getReminders);
router.delete('/:id', deleteReminder);
router.patch('/:id/toggle', toggleReminder);

export default router;
