import mongoose from '../lib/mongoose.js';

const appointmentSchema = new mongoose.Schema(
  {
    patientUserId: { type: String, required: true, index: true },
    doctorId: { type: String, required: true, index: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
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
