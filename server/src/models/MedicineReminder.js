import mongoose from '../lib/mongoose.js';

const medicineReminderSchema = new mongoose.Schema(
  {
    patientUserId: { type: String, required: true, index: true },
    medicineName: { type: String, required: true, trim: true },
    dosage: { type: String, required: true, trim: true },
    frequency: { type: String, default: 'Everyday', trim: true },
    time: { type: String, required: true, trim: true },
    startDate: { type: String, required: true },
    endDate: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    lastSentAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const MedicineReminder =
  mongoose.models.MedicineReminder || mongoose.model('MedicineReminder', medicineReminderSchema);

export default MedicineReminder;
