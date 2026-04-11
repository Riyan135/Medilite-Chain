import mongoose from '../lib/mongoose.js';

const patientProfileSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    bloodGroup: { type: String, default: null },
    allergies: { type: String, default: null },
    medicalHistory: { type: String, default: null },
    emergencyContact: { type: String, default: null },
    qrCode: { type: String, default: null },
    consultingDoctorId: { type: String, default: null },
    activeReminders: { type: Number, default: 0 },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

const PatientProfile =
  mongoose.models.PatientProfile || mongoose.model('PatientProfile', patientProfileSchema);

export default PatientProfile;
