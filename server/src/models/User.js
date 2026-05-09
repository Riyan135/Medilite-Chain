import mongoose from '../lib/mongoose.js';

const userSchema = new mongoose.Schema(
  {
    clerkId: { type: String, index: true, sparse: true },
    password: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    doctorId: { type: String, unique: true, sparse: true, trim: true, default: undefined },
    specialization: { type: String, default: null, trim: true },
    role: { type: String, enum: ['PATIENT', 'DOCTOR', 'ADMIN'], default: 'PATIENT' },
    phone: { type: String, default: null },
    profileImageUrl: { type: String, default: null },
    isVerified: { type: Boolean, default: false },
    lastPortalLoginAt: { type: Date, default: null },
    portalLoginCount: { type: Number, default: 0 },
    parentId: { type: String, default: null },
    relationToParent: { type: String, default: null },
    age: { type: Number, default: null },
    dateOfBirth: { type: Date, default: null },
    gender: { type: String, default: null },
    isBlocked: { type: Boolean, default: false },
    isFlagged: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
