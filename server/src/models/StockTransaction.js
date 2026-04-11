import mongoose from '../lib/mongoose.js';

const stockTransactionSchema = new mongoose.Schema(
  {
    medicineId: { type: String, required: true, index: true },
    medicineName: { type: String, required: true, trim: true },
    type: { type: String, enum: ['IN', 'OUT'], required: true },
    quantity: { type: Number, required: true, min: 1 },
    source: {
      type: String,
      enum: ['MANUAL', 'PRESCRIPTION', 'ADJUSTMENT', 'DELETE'],
      default: 'MANUAL',
    },
    note: { type: String, default: null, trim: true },
    consultationId: { type: String, default: null, index: true },
    createdBy: { type: String, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const StockTransaction =
  mongoose.models.StockTransaction || mongoose.model('StockTransaction', stockTransactionSchema);

export default StockTransaction;
