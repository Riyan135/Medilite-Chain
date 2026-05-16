import QRCode from 'qrcode';
import PatientProfile from '../models/PatientProfile.js';

import User from '../models/User.js';
import MedicalRecord from '../models/MedicalRecord.js';
import { uploadQR } from '../utils/cloudinary.js';

const attachConsultingDoctor = async (profile) => {
  if (!profile) {
    return null;
  }

  const result = profile.toObject ? profile.toObject() : { ...profile };

  if (result.consultingDoctorId) {
    const doctor = await User.findById(result.consultingDoctorId).select('_id name email phone').lean();
    if (doctor) {
      result.consultingDoctor = {
        id: doctor._id.toString(),
        name: doctor.name,
        email: doctor.email,
        phone: doctor.phone || null,
      };
    }
  }

  return result;
};

export const generatePatientQR = async (userId) => {
  try {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const scanUrl = `${clientUrl}/scan/${userId}`;
    const qrDataUrl = await QRCode.toDataURL(scanUrl, {
      color: {
        dark: '#2563eb', // Blue-600
        light: '#ffffff'
      },
      margin: 2,
      width: 400
    });

    // Upload to Cloudinary for permanent storage
    const cloudinaryUrl = await uploadQR(qrDataUrl, userId);
    return cloudinaryUrl;
  } catch (error) {
    console.error('Error generating patient QR:', error);
    return null;
  }
};

export const getPatientProfile = async (req, res) => {
  const id = req.params.id || req.user.id;

  try {
    if (id !== req.user.id && req.user.role === 'PATIENT') {
      const isFamilyMember = await User.exists({ _id: id, parentId: req.user.id });
      if (!isFamilyMember) {
        return res.status(403).json({ error: 'Unauthorized to view this patient profile' });
      }
    }

    const [user] = await Promise.all([
      User.findById(id).select('_id name email role phone profileImageUrl').lean(),
    ]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let patientProfile = await PatientProfile.findOne({ userId: id }).lean();
    if (!patientProfile) {
      console.log(`[LAZY_PROFILE] Profile missing for user ${id}. Attempting creation...`);
      try {
        const qrCode = await generatePatientQR(id);
        patientProfile = await PatientProfile.create({ userId: id, qrCode });
        console.log(`[LAZY_PROFILE] Successfully created profile for user ${id}`);
        patientProfile = patientProfile.toObject ? patientProfile.toObject() : patientProfile;
      } catch (createErr) {
        console.error(`[LAZY_PROFILE] Failed to create profile for user ${id}:`, createErr);
        // Fallback to a temporary object to avoid 404 if creation fails
        patientProfile = { userId: id };
      }
    } else if (!patientProfile.qrCode || patientProfile.qrCode.startsWith('data:image')) {
      // Lazy generation for missing QR or migration from legacy Base64 to Cloudinary
      const qrCode = await generatePatientQR(id);
      if (qrCode) {
        await PatientProfile.updateOne({ userId: id }, { $set: { qrCode } });
        patientProfile.qrCode = qrCode;
      }
    }

    const hydratedProfile = await attachConsultingDoctor(patientProfile);

    res.status(200).json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || null,
      profileImageUrl: user.profileImageUrl || null,
      patientProfile: hydratedProfile,
    });
  } catch (error) {
    console.error('Error fetching patient profile:', error);
    res.status(500).json({ error: 'Failed to fetch patient profile' });
  }
};

export const uploadProfilePicture = async (req, res) => {
  const id = req.params.id || req.user.id;
  const imageUrl = req.file?.path;

  if (req.user.role !== 'ADMIN' && req.user.id !== id) {
    const isFamilyMember = await User.exists({ _id: id, parentId: req.user.id });
    if (!isFamilyMember) {
      return res.status(403).json({ error: 'You can only update your own or your family member profile picture' });
    }
  }

  if (!imageUrl) {
    return res.status(400).json({ error: 'No profile picture uploaded' });
  }

  try {
    const user = await User.findByIdAndUpdate(
      id,
      { $set: { profileImageUrl: imageUrl } },
      { new: true }
    ).select('_id name email role phone profileImageUrl');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || null,
      profileImageUrl: user.profileImageUrl || null,
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ error: 'Failed to upload profile picture' });
  }
};

export const updatePatientProfile = async (req, res) => {
  const id = req.params.id || req.user.id;
  const { bloodGroup, allergies, medicalHistory, emergencyContact, gender, dob } = req.body;

  try {
    if (id !== req.user.id && req.user.role === 'PATIENT') {
      const isFamilyMember = await User.exists({ _id: id, parentId: req.user.id });
      if (!isFamilyMember) {
        return res.status(403).json({ error: 'Unauthorized to update this patient profile' });
      }
    }

    const updatedProfile = await PatientProfile.findOneAndUpdate(
      { userId: id },
      {
        $set: {
          ...(dob !== undefined && { dob: dob || null }),
          ...(bloodGroup !== undefined && { bloodGroup: bloodGroup || null }),
          ...(allergies !== undefined && { allergies: allergies || null }),
          ...(medicalHistory !== undefined && { medicalHistory: medicalHistory || null }),
          ...(emergencyContact !== undefined && { emergencyContact: emergencyContact || null }),
          ...(gender !== undefined && { gender: gender || null }),
        },
      },
      { new: true, upsert: true }
    ).lean();

    res.status(200).json(await attachConsultingDoctor(updatedProfile));
  } catch (error) {
    console.error('Error updating patient profile:', error);
    res.status(500).json({ error: 'Failed to update patient profile' });
  }
};

export const updateUserBasicInfo = async (req, res) => {
  const id = req.params.id || req.user.id;
  const { name, email, phone } = req.body;

  // Only allow users to update their own info (or admins)
  if (id !== req.user.id && req.user.role !== 'ADMIN' && req.user.role !== 'SYSTEM_ADMIN') {
    return res.status(403).json({ error: 'Unauthorized to update this user' });
  }

  try {
    const updates = {};
    if (name && name.trim()) updates.name = name.trim();
    if (email && email.trim()) updates.email = email.trim().toLowerCase();
    if (phone !== undefined) updates.phone = phone.trim() || null;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const user = await User.findByIdAndUpdate(id, { $set: updates }, { new: true })
      .select('_id name email role phone profileImageUrl');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || null,
      profileImageUrl: user.profileImageUrl || null,
    });
  } catch (error) {
    console.error('Error updating user info:', error);
    res.status(500).json({ error: 'Failed to update user info' });
  }
};

export const getDashboardStats = async (req, res) => {
  const id = req.params.id || req.user.id;

  try {
    if (id !== req.user.id && req.user.role === 'PATIENT') {
      const isFamilyMember = await User.exists({ _id: id, parentId: req.user.id });
      if (!isFamilyMember) {
        return res.status(403).json({ error: 'Unauthorized to view dashboard stats for this patient' });
      }
    }

    let patientProfile = await PatientProfile.findOne({ userId: id }).lean();
    if (!patientProfile) {
      console.log(`Creating missing patient profile for stats for user ${id}`);
      patientProfile = await PatientProfile.create({ userId: id });
      patientProfile = patientProfile.toObject ? patientProfile.toObject() : patientProfile;
    }

    const records = await MedicalRecord.find({ patientUserId: id }).lean();

    const totalRecords = records.length;
    const activeReminders = patientProfile.activeReminders || 0;
    const activePrescriptions = records.filter((record) => record.type === 'PRESCRIPTION').length;
    const profileCompletion = patientProfile.bloodGroup && patientProfile.emergencyContact ? 92 : patientProfile.bloodGroup || patientProfile.emergencyContact ? 68 : 36;
    const reminderSupport = Math.min(100, activeReminders * 20 + 20);
    const recordsCoverage = Math.min(100, totalRecords * 18 + 22);
    const safetyReadiness = patientProfile.allergies || patientProfile.emergencyContact ? 82 : 48;
    const healthScore = Math.round((profileCompletion + reminderSupport + recordsCoverage + safetyReadiness) / 4);

    res.status(200).json({
      totalRecords,
      activeReminders,
      activePrescriptions,
      healthScore,
      healthBreakdown: {
        profileCompletion,
        reminderSupport,
        recordsCoverage,
        safetyReadiness,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};
export const getPublicEmergencyProfile = async (req, res) => {
  const { id } = req.params;

  try {
    const [user, patientProfile] = await Promise.all([
      User.findById(id).select('_id name profileImageUrl phone').lean(),
      PatientProfile.findOne({ userId: id }).select('bloodGroup allergies emergencyContact').lean(),
    ]);

    if (!user || !patientProfile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.status(200).json({
      name: user.name,
      profileImageUrl: user.profileImageUrl,
      phone: user.phone,
      dob: patientProfile.dob,
      bloodGroup: patientProfile.bloodGroup,
      allergies: patientProfile.allergies,
      emergencyContact: patientProfile.emergencyContact,
    });
  } catch (error) {
    console.error('Error fetching public profile:', error);
    res.status(500).json({ error: 'Failed to fetch public profile' });
  }
};

export const createAnonymousPatient = async (req, res) => {
  const emergencyId = `EMG-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const placeholderEmail = `emergency.${emergencyId.toLowerCase()}@medilite.temp`;
  const placeholderPassword = Math.random().toString(36).slice(-10);

  try {
    // Create the anonymous user
    const user = await User.create({
      name: `Emergency Patient (${emergencyId})`,
      email: placeholderEmail,
      password: placeholderPassword,
      role: 'PATIENT',
      phone: '0000000000',
    });

    // Create the patient profile
    await PatientProfile.create({
      userId: user._id,
      bloodGroup: 'UNKNOWN',
      medicalHistory: 'EMERGENCY ANONYMOUS ADMISSION',
      allergies: 'UNKNOWN',
    });

    res.status(201).json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      emergencyId,
    });
  } catch (error) {
    console.error('Error creating anonymous patient:', error);
    res.status(500).json({ error: 'Failed to create emergency profile' });
  }
};
