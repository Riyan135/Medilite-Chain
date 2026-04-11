import mongoose from '../lib/mongoose.js';

const messageSchema = new mongoose.Schema(
  {
    senderId: { type: String, required: true, index: true },
    receiverId: { type: String, required: true, index: true },
    consultationId: { type: String, default: null, index: true },
    content: { type: String, required: true, trim: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

export default Message;
