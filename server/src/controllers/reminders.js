import MedicineReminder from '../models/MedicineReminder.js';
import PatientProfile from '../models/PatientProfile.js';
import User from '../models/User.js';
import { sendReminderEmail } from '../services/mailer.js';

const toReminderResponse = (reminder) => ({
  ...reminder,
  id: reminder._id.toString(),
});

const syncActiveReminderCount = async (patientUserId) => {
  const activeCount = await MedicineReminder.countDocuments({
    patientUserId,
    isActive: true,
  });

  await PatientProfile.findOneAndUpdate(
    { userId: patientUserId },
    { $set: { activeReminders: activeCount } }
  );
};

export const createReminder = async (req, res) => {
  const { medicineName, dosage, frequency, time, startDate, endDate, patientId } = req.body;
  const targetUserId = patientId || req.user.id;

  try {
    if (targetUserId !== req.user.id) {
      const isFamilyMember = await User.exists({ _id: targetUserId, parentId: req.user.id });
      if (!isFamilyMember) {
        return res.status(403).json({ error: 'Unauthorized to add reminders for this patient' });
      }
    }

    const [user, patientProfile] = await Promise.all([
      User.findById(targetUserId).lean(),
      PatientProfile.findOne({ userId: targetUserId }).lean(),
    ]);

    if (!user || !patientProfile) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    const reminder = await MedicineReminder.create({
      patientUserId: targetUserId,
      medicineName,
      dosage,
      frequency,
      time,
      startDate,
      endDate: endDate || null,
      isActive: true,
    });

    await syncActiveReminderCount(targetUserId);

    if (user.email) {
      await sendReminderEmail({
        to: user.email,
        name: user.name,
        medicineName,
        dosage,
        time,
        type: 'created',
      });
    }

    res.status(201).json({
      ...toReminderResponse(reminder.toObject()),
      emailEnabled: Boolean(user.email),
    });
  } catch (error) {
    console.error('Error creating reminder:', error);
    res.status(500).json({ error: 'Failed to create reminder' });
  }
};

export const getReminders = async (req, res) => {
  const userId = req.params.id || req.user.id;

  try {
    if (userId !== req.user.id) {
      const isFamilyMember = await User.exists({ _id: userId, parentId: req.user.id });
      if (!isFamilyMember) {
        return res.status(403).json({ error: 'Unauthorized to view reminders for this patient' });
      }
    }

    const [user, reminders] = await Promise.all([
      User.findById(userId).lean(),
      MedicineReminder.find({ patientUserId: userId }).sort({ createdAt: -1 }).lean(),
    ]);

    if (!user) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    res.status(200).json(reminders.map(toReminderResponse));
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
};

export const deleteReminder = async (req, res) => {
  const { id } = req.params;

  try {
    const reminder = await MedicineReminder.findById(id);

    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    if (reminder.patientUserId !== req.user.id && req.user.role === 'PATIENT') {
      const isFamilyMember = await User.exists({ _id: reminder.patientUserId, parentId: req.user.id });
      if (!isFamilyMember) {
        return res.status(403).json({ error: 'Unauthorized to delete this reminder' });
      }
    }

    await MedicineReminder.findByIdAndDelete(id);

    await syncActiveReminderCount(reminder.patientUserId);
    res.status(200).json({ message: 'Reminder deleted' });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    res.status(500).json({ error: 'Failed to delete reminder' });
  }
};

export const toggleReminder = async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  try {
    const reminder = await MedicineReminder.findById(id);

    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    if (reminder.patientUserId !== req.user.id && req.user.role === 'PATIENT') {
      const isFamilyMember = await User.exists({ _id: reminder.patientUserId, parentId: req.user.id });
      if (!isFamilyMember) {
        return res.status(403).json({ error: 'Unauthorized to toggle this reminder' });
      }
    }

    const updated = await MedicineReminder.findByIdAndUpdate(
      id,
      { $set: { isActive } },
      { new: true }
    ).lean();

    await syncActiveReminderCount(updated.patientUserId);
    res.status(200).json(toReminderResponse(updated));
  } catch (error) {
    console.error('Error toggling reminder:', error);
    res.status(500).json({ error: 'Failed to toggle reminder' });
  }
};
