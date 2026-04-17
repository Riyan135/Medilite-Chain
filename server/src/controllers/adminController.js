import User from '../models/User.js';
import PatientProfile from '../models/PatientProfile.js';
import MedicalRecord from '../models/MedicalRecord.js';

const hydrateDoctor = async (doctorId) => {
  if (!doctorId) {
    return null;
  }

  const doctor = await User.findById(doctorId).select('_id name email phone').lean();
  if (!doctor) {
    return null;
  }

  return {
    id: doctor._id.toString(),
    name: doctor.name,
    email: doctor.email,
    phone: doctor.phone || null,
  };
};

const buildPatientRow = async (user, profile, records) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  patientProfile: profile
    ? {
        ...profile,
        id: profile._id.toString(),
        records,
        consultingDoctor: await hydrateDoctor(profile.consultingDoctorId),
      }
    : null,
});

export const getAllPatients = async (req, res) => {
  try {
    const users = await User.find({ role: 'PATIENT' }).sort({ createdAt: -1 }).lean();
    const profiles = await PatientProfile.find({
      userId: { $in: users.map((user) => user._id.toString()) },
    }).lean();
    const records = await MedicalRecord.find({
      patientUserId: { $in: users.map((user) => user._id.toString()) },
    }).lean();

    const profileMap = new Map(profiles.map((profile) => [profile.userId, profile]));
    const recordMap = new Map();

    for (const record of records) {
      const key = record.patientUserId;
      const list = recordMap.get(key) || [];
      list.push({ ...record, id: record._id.toString() });
      recordMap.set(key, list);
    }

    const payload = await Promise.all(
      users.map((user) =>
        buildPatientRow(user, profileMap.get(user._id.toString()) || null, recordMap.get(user._id.toString()) || [])
      )
    );

    res.json(payload);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getPatientDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).lean();
    const profile = await PatientProfile.findOne({ userId: id }).lean();
    const records = await MedicalRecord.find({ patientUserId: id }).sort({ date: -1 }).lean();

    if (!user) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json(
      await buildPatientRow(
        user,
        profile,
        records.map((record) => ({ ...record, id: record._id.toString() }))
      )
    );
  } catch (error) {
    console.error('Error fetching patient details:', error);
    res.status(500).json({ error: error.message });
  }
};

export const assignDoctor = async (req, res) => {
  try {
    const { patientId, doctorId } = req.body;
    const user = await User.findById(patientId).lean();

    if (!user) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const updatedProfile = await PatientProfile.findOneAndUpdate(
      { userId: patientId },
      { $set: { consultingDoctorId: doctorId } },
      { new: true }
    ).lean();

    if (!updatedProfile) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    res.json({
      ...updatedProfile,
      id: updatedProfile._id.toString(),
      consultingDoctor: await hydrateDoctor(updatedProfile.consultingDoctorId),
    });
  } catch (error) {
    console.error('Error assigning doctor:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getAllDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ role: 'DOCTOR' }).sort({ name: 1 }).lean();
    res.json(
      doctors.map((doctor) => ({
        id: doctor._id.toString(),
        name: doctor.name,
        email: doctor.email,
        phone: doctor.phone || null,
        doctorId: doctor.doctorId || null,
        specialization: doctor.specialization || null,
      }))
    );
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ error: error.message });
  }
};
