import cron from 'node-cron';

import MedicineReminder from '../models/MedicineReminder.js';
import User from '../models/User.js';
import { sendReminderEmail } from './mailer.js';

const daySets = {
  Everyday: [0, 1, 2, 3, 4, 5, 6],
  'Mon, Wed, Fri': [1, 3, 5],
  'Tue, Thu, Sat': [2, 4, 6],
  Weekends: [0, 6],
};

const formatDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const isReminderDueToday = (reminder, now) => {
  const today = formatDate(now);
  const days = daySets[reminder.frequency] || daySets.Everyday;

  if (today < reminder.startDate) return false;
  if (reminder.endDate && today > reminder.endDate) return false;
  if (!days.includes(now.getDay())) return false;
  if (reminder.time !== `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`) {
    return false;
  }

  if (reminder.lastSentAt) {
    const last = new Date(reminder.lastSentAt);
    if (
      formatDate(last) === today &&
      last.getHours() === now.getHours() &&
      last.getMinutes() === now.getMinutes()
    ) {
      return false;
    }
  }

  return true;
};

const processReminder = async (reminder, now) => {
  const user = await User.findById(reminder.patientUserId).lean();
  if (!user?.email) {
    console.log(`[Reminder] Skipping email for ${reminder.medicineName}; no email on user ${reminder.patientUserId}`);
    return;
  }

  await sendReminderEmail({
    to: user.email,
    name: user.name,
    medicineName: reminder.medicineName,
    dosage: reminder.dosage,
    time: reminder.time,
    type: 'due',
  });

  await MedicineReminder.findByIdAndUpdate(reminder._id, { $set: { lastSentAt: now } });
};

export const runReminderCycle = async () => {
  const now = new Date();
  const reminders = await MedicineReminder.find({ isActive: true }).lean();

  for (const reminder of reminders) {
    if (isReminderDueToday(reminder, now)) {
      try {
        await processReminder(reminder, now);
      } catch (error) {
        console.error(`Error sending reminder for ${reminder._id}:`, error);
      }
    }
  }
};

export const startReminderScheduler = () => {
  cron.schedule('* * * * *', () => {
    runReminderCycle().catch((error) => {
      console.error('Reminder scheduler failed:', error);
    });
  });
};
