import bcrypt from 'bcryptjs';

import User from '../models/User.js';
import { generateDoctorIdCandidate } from './doctorIdentity.js';

const normalizeEmail = (value) => value?.trim().toLowerCase();
const normalizeName = (value) => value?.trim();
const ensureDoctorIds = async () => {
  const doctorsWithoutIds = await User.find({
    role: 'DOCTOR',
    $or: [{ doctorId: null }, { doctorId: { $exists: false } }],
  });

  for (const doctor of doctorsWithoutIds) {
    let doctorId = generateDoctorIdCandidate();
    while (await User.exists({ doctorId })) {
      doctorId = generateDoctorIdCandidate();
    }

    doctor.doctorId = doctorId;
    await doctor.save();
    console.log(`Assigned Doctor ID ${doctorId} to ${doctor.email}`);
  }
};

export const ensureAdminUser = async () => {
  const email = normalizeEmail(process.env.ADMIN_EMAIL);
  const password = process.env.ADMIN_PASSWORD;
  const name = normalizeName(process.env.ADMIN_NAME) || 'Admin User';
  const phone = process.env.ADMIN_PHONE?.trim() || null;

  if (!email || !password) {
    await ensureDoctorIds();
    return;
  }

  const existingAdmin = await User.findOne({ email });
  const hashedPassword = await bcrypt.hash(password, 10);

  if (!existingAdmin) {
    await User.create({
      email,
      password: hashedPassword,
      name,
      phone,
      role: 'ADMIN',
      isVerified: true,
    });
    console.log(`Bootstrapped admin user for ${email}`);
    return;
  }

  let shouldSave = false;

  if (existingAdmin.role !== 'ADMIN') {
    existingAdmin.role = 'ADMIN';
    shouldSave = true;
  }

  if (existingAdmin.name !== name) {
    existingAdmin.name = name;
    shouldSave = true;
  }

  if (existingAdmin.phone !== phone) {
    existingAdmin.phone = phone;
    shouldSave = true;
  }

  const passwordMatches = await bcrypt.compare(password, existingAdmin.password);
  if (!passwordMatches) {
    existingAdmin.password = hashedPassword;
    shouldSave = true;
  }

  if (!existingAdmin.isVerified) {
    existingAdmin.isVerified = true;
    shouldSave = true;
  }

  if (shouldSave) {
    await existingAdmin.save();
    console.log(`Updated bootstrapped admin user for ${email}`);
  }

  await ensureDoctorIds();
};
