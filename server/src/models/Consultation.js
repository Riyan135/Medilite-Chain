import mongoose from '../lib/mongoose.js';

const prescriptionItemSchema = new mongoose.Schema(
  {
    medicine: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    dosage: { type: String, required: true, trim: true },
    duration: { type: String, required: true, trim: true },
    instructions: { type: String, default: null, trim: true },
  },
  {
    _id: false,
  }
);

const consultationSchema = new mongoose.Schema(
  {
    appointmentId: { type: String, default: null, index: true },
    patientId: { type: String, required: true, index: true },
    doctorId: { type: String, required: true, index: true },
    symptoms: { type: String, default: null, trim: true },
    diagnosis: { type: String, default: null, trim: true },
    notes: { type: String, default: null, trim: true },
    prescription: { type: [prescriptionItemSchema], default: [] },
    consultationType: {
      type: String,
      enum: ['ONLINE_CHAT', 'VIDEO_CALL', 'IN_PERSON'],
      default: 'ONLINE_CHAT',
    },
    status: {
      type: String,
      enum: ['PENDING', 'ONGOING', 'COMPLETED'],
      default: 'PENDING',
    },
    scheduledDate: { type: String, default: null },
    scheduledTime: { type: String, default: null },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Consultation =
  mongoose.models.Consultation || mongoose.model('Consultation', consultationSchema);

export default Consultation;
