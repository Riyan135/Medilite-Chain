import Message from '../models/Message.js';
import User from '../models/User.js';

const hydrateMessage = async (message) => {
  const value = message.toObject ? message.toObject() : { ...message };
  const [sender, receiver] = await Promise.all([
    User.findById(value.senderId).select('_id name email role').lean(),
    User.findById(value.receiverId).select('_id name email role').lean(),
  ]);

  return {
    ...value,
    id: value._id.toString(),
    sender: sender
      ? { id: sender._id.toString(), name: sender.name, email: sender.email, role: sender.role }
      : null,
    receiver: receiver
      ? { id: receiver._id.toString(), name: receiver.name, email: receiver.email, role: receiver.role }
      : null,
  };
};

export const sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, content, consultationId } = req.body;
    const message = await Message.create({
      senderId,
      receiverId,
      consultationId: consultationId || null,
      content,
    });
    res.status(201).json(await hydrateMessage(message));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;
    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    })
      .sort({ createdAt: 1 })
      .lean();
    res.json(await Promise.all(messages.map((message) => hydrateMessage(message))));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
