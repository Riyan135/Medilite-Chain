import crypto from 'node:crypto';

import User from '../models/User.js';

export const generateDoctorIdCandidate = () => `DOC-${crypto.randomInt(100000, 999999)}`;

export const ensureDoctorId = async (user, customDoctorId = null) => {
  if (user.doctorId) {
    return user.doctorId;
  }

  let doctorId = customDoctorId || generateDoctorIdCandidate();
  while (await User.exists({ doctorId })) {
    if (customDoctorId) {
      throw new Error(`Doctor ID ${customDoctorId} is already in use.`);
    }
    doctorId = generateDoctorIdCandidate();
  }

  user.doctorId = doctorId;
  await user.save();
  return doctorId;
};
