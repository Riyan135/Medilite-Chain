import mongoose from '../lib/mongoose.js';

const medicineInventorySchema = new mongoose.Schema(
  {
    patientUserId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
    minThreshold: { type: Number, required: true, min: 0, default: 0 },
    unit: { type: String, default: 'units', trim: true },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

const MedicineInventory =
  mongoose.models.MedicineInventory ||
  mongoose.model('MedicineInventory', medicineInventorySchema);

export default MedicineInventory;
