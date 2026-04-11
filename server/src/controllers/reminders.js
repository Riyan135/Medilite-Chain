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
  const { medicineName, dosage, frequency, time, startDate, endDate } = req.body;
  const userId = req.user.id;

  try {
    const [user, patientProfile] = await Promise.all([
      User.findById(userId).lean(),
      PatientProfile.findOne({ userId }).lean(),
    ]);

    if (!user || !patientProfile) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    const reminder = await MedicineReminder.create({
      patientUserId: userId,
      medicineName,
      dosage,
      frequency,
      time,
      startDate,
      endDate: endDate || null,
      isActive: true,
    });

    await syncActiveReminderCount(userId);

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
    const reminder = await MedicineReminder.findByIdAndDelete(id).lean();
    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

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
    const updated = await MedicineReminder.findByIdAndUpdate(
      id,
      { $set: { isActive } },
      { new: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    await syncActiveReminderCount(updated.patientUserId);
    res.status(200).json(toReminderResponse(updated));
  } catch (error) {
    console.error('Error toggling reminder:', error);
    res.status(500).json({ error: 'Failed to toggle reminder' });
  }
};
