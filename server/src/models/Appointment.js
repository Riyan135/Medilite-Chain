import mongoose from '../lib/mongoose.js';

const appointmentSchema = new mongoose.Schema(
  {
    patientUserId: { type: String, required: true, index: true },
    doctorId: { type: String, required: true, index: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    appointmentType: {
      type: String,
      enum: ['CLINIC_VISIT', 'VIDEO_CALL', 'CHAT_CONSULTATION', 'EMERGENCY'],
      default: 'CLINIC_VISIT',
    },
    reason: { type: String, default: null },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
      default: 'PENDING',
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

const Appointment =
  mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);

export default Appointment;
