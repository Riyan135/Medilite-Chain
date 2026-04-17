import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

import User from '../models/User.js';
import MedicalRecord from '../models/MedicalRecord.js';
import Appointment from '../models/Appointment.js';
import Consultation from '../models/Consultation.js';
import Medicine from '../models/Medicine.js';
import { serializeMedicine } from '../services/medicineStock.js';
import { sendDoctorIdEmail } from '../services/mailer.js';
import { ensureDoctorId } from '../services/doctorIdentity.js';

const ensureAdminAccess = (req, res) => {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ error: 'Only system admin accounts can perform this action' });
    return false;
  }

  return true;
};

export const getSystemStats = async (req, res) => {
  try {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const [
      totalUsers,
      totalRecords,
      pendingDoctors,
      loggedInPatients,
      recentLogs,
      totalAppointments,
      appointmentsToday,
      acceptedAppointments,
      pendingAppointments,
      totalConsultations,
      ongoingConsultations,
      completedConsultations,
      medicines,
    ] = await Promise.all([
      User.countDocuments(),
      MedicalRecord.countDocuments(),
      User.countDocuments({ role: 'DOCTOR', isVerified: false }),
      User.countDocuments({ role: 'PATIENT', lastPortalLoginAt: { $ne: null } }),
      MedicalRecord.find().sort({ createdAt: -1 }).limit(4).lean(),
      Appointment.countDocuments(),
      Appointment.countDocuments({ date: today }),
      Appointment.countDocuments({ status: 'ACCEPTED' }),
      Appointment.countDocuments({ status: 'PENDING' }),
      Consultation.countDocuments(),
      Consultation.countDocuments({ status: 'ONGOING' }),
      Consultation.countDocuments({ status: 'COMPLETED' }),
      Medicine.find().lean(),
    ]);

    const serializedMedicines = medicines.map(serializeMedicine);

    res.status(200).json({
      totalUsers,
      totalRecords,
      pendingDoctors,
      loggedInPatients,
      totalAppointments,
      appointmentsToday,
      acceptedAppointments,
      pendingAppointments,
      totalConsultations,
      ongoingConsultations,
      completedConsultations,
      totalMedicines: serializedMedicines.length,
      lowStockMedicines: serializedMedicines.filter((item) => item.isLowStock).length,
      expiredMedicines: serializedMedicines.filter((item) => item.isExpired).length,
      nearExpiryMedicines: serializedMedicines.filter((item) => item.isNearExpiry).length,
      activeSessions: Math.max(1, Math.floor(totalUsers * 0.4)),
      recentLogs: recentLogs.map((log) => ({
        id: log._id.toString(),
        message: `New medical record uploaded: ${log.title}`,
        time: log.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({ error: 'Failed to fetch system stats' });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();
    res.status(200).json(
      users.map((user) => ({
        ...user,
        id: user._id.toString(),
      }))
    );
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    await User.findByIdAndDelete(id);
    res.status(200).json({ message: 'User deleted' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

export const approveDoctor = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByIdAndUpdate(
      id,
      { $set: { role: 'DOCTOR', isVerified: true } },
      { new: true }
    ).lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      ...user,
      id: user._id.toString(),
    });
  } catch (error) {
    console.error('Error approving doctor:', error);
    res.status(500).json({ error: 'Failed to approve doctor' });
  }
};

export const createDoctorAccount = async (req, res) => {
  if (!ensureAdminAccess(req, res)) {
    return;
  }

  const normalizedName = req.body.name?.trim();
  const normalizedEmail = req.body.email?.trim().toLowerCase();
  const normalizedPhone = req.body.phone?.trim() || null;
  const normalizedSpecialization = req.body.specialization?.trim();
  const customDoctorId = req.body.customDoctorId?.trim() || null;

  try {
    if (!normalizedName || !normalizedEmail || !normalizedSpecialization) {
      return res.status(400).json({ error: 'Name, email, and specialization are required' });
    }

    const existingUser = await User.findOne({
      $or: [
        { email: normalizedEmail },
        ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
      ],
    });

    if (existingUser?.role === 'DOCTOR') {
      const existingDoctorId = await ensureDoctorId(existingUser);
      return res.status(400).json({
        error: `Doctor account already exists with Doctor ID ${existingDoctorId}.`,
        doctorId: existingDoctorId,
      });
    }

    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email or phone already exists' });
    }

    const doctor = new User({
      email: normalizedEmail,
      password: await bcrypt.hash(crypto.randomUUID(), 10),
      name: normalizedName,
      phone: normalizedPhone,
      specialization: normalizedSpecialization,
      role: 'DOCTOR',
      isVerified: true,
    });

    const doctorId = await ensureDoctorId(doctor, customDoctorId);

    await sendDoctorIdEmail({
      to: normalizedEmail,
      name: normalizedName,
      doctorId,
    });

    res.status(201).json({
      id: doctor._id.toString(),
      name: doctor.name,
      email: doctor.email,
      phone: doctor.phone || null,
      specialization: doctor.specialization || null,
      doctorId,
      message: 'Doctor account created successfully',
    });
  } catch (error) {
    console.error('Error creating doctor account:', error);
    res.status(500).json({ error: 'Failed to create doctor account' });
  }
};
