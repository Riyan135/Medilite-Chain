import mongoose from '../lib/mongoose.js';

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    category: {
      type: String,
      enum: ['TABLET', 'SYRUP', 'INJECTION'],
      required: true,
      default: 'TABLET',
    },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    price: { type: Number, required: true, min: 0, default: 0 },
    expiryDate: { type: Date, required: true },
    supplier: { type: String, required: true, trim: true },
    lowStockThreshold: { type: Number, required: true, min: 0, default: 10 },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

medicineSchema.index({ name: 1, supplier: 1 }, { unique: false });

const Medicine = mongoose.models.Medicine || mongoose.model('Medicine', medicineSchema);

export default Medicine;
