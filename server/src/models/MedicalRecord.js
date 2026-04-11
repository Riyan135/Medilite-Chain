import mongoose from '../lib/mongoose.js';

const medicalRecordSchema = new mongoose.Schema(
  {
    patientUserId: { type: String, required: true, index: true },
    doctorId: { type: String, default: null },
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['REPORT', 'BILL', 'PRESCRIPTION', 'LAB_TEST'],
      default: 'REPORT',
    },
    description: { type: String, default: null },
    fileUrl: { type: String, required: true },
    summary: { type: mongoose.Schema.Types.Mixed, default: null },
    date: { type: Date, default: Date.now },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

const MedicalRecord =
  mongoose.models.MedicalRecord || mongoose.model('MedicalRecord', medicalRecordSchema);

export default MedicalRecord;
