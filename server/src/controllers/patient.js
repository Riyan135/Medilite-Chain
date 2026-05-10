import PatientProfile from '../models/PatientProfile.js';
import User from '../models/User.js';
import MedicalRecord from '../models/MedicalRecord.js';

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

export const getPatientProfile = async (req, res) => {
  const id = req.params.id || req.user.id;

  try {
    if (id !== req.user.id && req.user.role === 'PATIENT') {
      const isFamilyMember = await User.exists({ _id: id, parentId: req.user.id });
      if (!isFamilyMember) {
        return res.status(403).json({ error: 'Unauthorized to view this patient profile' });
      }
    }

    const [user, patientProfile] = await Promise.all([
      User.findById(id).select('_id name email role phone profileImageUrl').lean(),
      PatientProfile.findOne({ userId: id }).lean(),
    ]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!patientProfile) {
      return res.status(404).json({ error: 'Patient profile not found' });
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
  const { bloodGroup, allergies, medicalHistory, emergencyContact, gender } = req.body;

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
          ...(bloodGroup !== undefined && { bloodGroup: bloodGroup || null }),
          ...(allergies !== undefined && { allergies: allergies || null }),
          ...(medicalHistory !== undefined && { medicalHistory: medicalHistory || null }),
          ...(emergencyContact !== undefined && { emergencyContact: emergencyContact || null }),
          ...(gender !== undefined && { gender: gender || null }),
        },
      },
      { new: true }
    ).lean();

    if (!updatedProfile) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    res.status(200).json(await attachConsultingDoctor(updatedProfile));
  } catch (error) {
    console.error('Error updating patient profile:', error);
    res.status(500).json({ error: 'Failed to update patient profile' });
  }
};

export const updateUserBasicInfo = async (req, res) => {
  const id = req.params.id || req.user.id;
  const { name, phone } = req.body;

  // Only allow users to update their own info (or admins)
  if (id !== req.user.id && req.user.role !== 'ADMIN' && req.user.role !== 'SYSTEM_ADMIN') {
    return res.status(403).json({ error: 'Unauthorized to update this user' });
  }

  try {
    const updates = {};
    if (name && name.trim()) updates.name = name.trim();
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

    const [patientProfile, records] = await Promise.all([
      PatientProfile.findOne({ userId: id }).lean(),
      MedicalRecord.find({ patientUserId: id }).lean(),
    ]);

    if (!patientProfile) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

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
