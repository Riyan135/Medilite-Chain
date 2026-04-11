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
    const [user, patientProfile] = await Promise.all([
      User.findById(id).select('_id name email role phone').lean(),
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
      patientProfile: hydratedProfile,
    });
  } catch (error) {
    console.error('Error fetching patient profile:', error);
    res.status(500).json({ error: 'Failed to fetch patient profile' });
  }
};

export const updatePatientProfile = async (req, res) => {
  const id = req.params.id || req.user.id;
  const { bloodGroup, allergies, medicalHistory, emergencyContact } = req.body;

  try {
    const updatedProfile = await PatientProfile.findOneAndUpdate(
      { userId: id },
      {
        $set: {
          bloodGroup: bloodGroup || null,
          allergies: allergies || null,
          medicalHistory: medicalHistory || null,
          emergencyContact: emergencyContact || null,
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

export const getDashboardStats = async (req, res) => {
  const id = req.params.id || req.user.id;

  try {
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

    res.status(200).json({
      totalRecords,
      activeReminders,
      activePrescriptions,
      healthScore: Math.min(100, 60 + totalRecords * 5),
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};
