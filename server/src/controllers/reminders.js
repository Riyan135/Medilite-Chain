import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

export const createReminder = async (req, res) => {
  const { medicineName, dosage, frequency, time, startDate, endDate } = req.body;
  const userId = req.user.id;


  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { patientProfile: true }
    });


    if (!user || !user.patientProfile) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    const reminder = await prisma.medicineReminder.create({
      data: {
        medicineName,
        dosage,
        frequency,
        time,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        patientId: user.patientProfile.id
      }
    });

    res.status(201).json(reminder);
  } catch (error) {
    console.error('Error creating reminder:', error);
    res.status(500).json({ error: 'Failed to create reminder' });
  }
};

export const getReminders = async (req, res) => {
  const userId = req.params.userId || req.user.id;


  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {

        patientProfile: {
          include: {
            reminders: {
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      }
    });

    if (!user || !user.patientProfile) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    res.status(200).json(user.patientProfile.reminders);
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
};

export const deleteReminder = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.medicineReminder.delete({
      where: { id }
    });
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
    const updated = await prisma.medicineReminder.update({
      where: { id },
      data: { isActive }
    });
    res.status(200).json(updated);
  } catch (error) {
    console.error('Error toggling reminder:', error);
    res.status(500).json({ error: 'Failed to toggle reminder' });
  }
};
