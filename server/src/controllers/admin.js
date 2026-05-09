import User from '../models/User.js';
import MedicalRecord from '../models/MedicalRecord.js';
import Appointment from '../models/Appointment.js';
import Consultation from '../models/Consultation.js';
import Medicine from '../models/Medicine.js';
import { serializeMedicine } from '../services/medicineStock.js';

export const getSystemStats = async (req, res) => {
  try {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const doctorScopedQuery = req.user?.role === 'DOCTOR' ? { doctorId: req.user.id } : {};

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
      Appointment.countDocuments(doctorScopedQuery),
      Appointment.countDocuments({ ...doctorScopedQuery, date: today }),
      Appointment.countDocuments({ ...doctorScopedQuery, status: 'ACCEPTED' }),
      Appointment.countDocuments({ ...doctorScopedQuery, status: 'PENDING' }),
      Consultation.countDocuments(doctorScopedQuery),
      Consultation.countDocuments({ ...doctorScopedQuery, status: 'ONGOING' }),
      Consultation.countDocuments({ ...doctorScopedQuery, status: 'COMPLETED' }),
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

export const toggleBlockUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.status(200).json({
      message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`,
      isBlocked: user.isBlocked,
    });
  } catch (error) {
    console.error('Error toggling block status:', error);
    res.status(500).json({ error: 'Failed to update user block status' });
  }
};

export const toggleFlagUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.isFlagged = !user.isFlagged;
    await user.save();

    res.status(200).json({
      message: `User ${user.isFlagged ? 'flagged' : 'unflagged'} successfully`,
      isFlagged: user.isFlagged,
    });
  } catch (error) {
    console.error('Error toggling flag status:', error);
    res.status(500).json({ error: 'Failed to update user flag status' });
  }
};
