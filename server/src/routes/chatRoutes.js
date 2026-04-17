import express from 'express';
import { sendMessage, getMessages, getConversations } from '../controllers/chatController.js';

const router = express.Router();

router.post('/', sendMessage);
router.get('/conversations/:userId', getConversations);
router.get('/:userId/:otherUserId', getMessages);

export default router;
