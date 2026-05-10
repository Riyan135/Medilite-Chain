import mongoose from '../lib/mongoose.js';

const medicalIntakeSchema = new mongoose.Schema(
  {
    symptoms: { type: String, default: null, trim: true },
    illnessDuration: { type: String, default: null, trim: true },
    allergies: { type: String, default: null, trim: true },
    currentMedicines: { type: String, default: null, trim: true },
    pastMedicalHistory: {
      diabetes: { type: Boolean, default: false },
      bloodPressure: { type: Boolean, default: false },
      asthma: { type: Boolean, default: false },
      heartDisease: { type: Boolean, default: false },
      kidneyDisease: { type: Boolean, default: false },
      liverDisease: { type: Boolean, default: false },
      other: { type: String, default: null, trim: true },
    },
    pregnancyStatus: {
      type: String,
      enum: ['NOT_APPLICABLE', 'NO', 'PREGNANT', 'BREASTFEEDING', 'UNSURE'],
      default: 'NOT_APPLICABLE',
    },
    reportLinks: { type: [String], default: [] },
  },
  { _id: false }
);

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
    medicalIntake: { type: medicalIntakeSchema, default: null },
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
