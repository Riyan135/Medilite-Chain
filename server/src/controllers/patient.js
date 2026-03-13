import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

export const getPatientProfile = async (req, res) => {
  const id = req.params.id || req.user.id;


  try {
    const profile = await prisma.user.findUnique({
      where: { id },
      include: {
        patientProfile: {
          include: {
            records: true,
            reminders: true,
            notes: true
          }
        }
      }
    });
    // ... rest same


    if (!profile) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(profile);
  } catch (error) {
    console.error('Error fetching patient profile:', error);
    res.status(500).json({ error: 'Failed to fetch patient profile' });
  }
};

export const updatePatientProfile = async (req, res) => {
  const id = req.params.id || req.user.id;

  const { bloodGroup, allergies, medicalHistory, emergencyContact } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { patientProfile: true }
    });


    if (!user || !user.patientProfile) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    const updatedProfile = await prisma.patientProfile.update({
      where: { id: user.patientProfile.id },
      data: {
        bloodGroup,
        allergies,
        medicalHistory,
        emergencyContact
      }
    });

    res.status(200).json(updatedProfile);
  } catch (error) {
    console.error('Error updating patient profile:', error);
    res.status(500).json({ error: 'Failed to update patient profile' });
  }
};

export const getDashboardStats = async (req, res) => {
  const id = req.params.id || req.user.id;


  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {

        patientProfile: {
          include: {
            records: true,
            reminders: { where: { isActive: true } },
          }
        }
      }
    });

    if (!user || !user.patientProfile) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    const stats = {
      totalRecords: user.patientProfile.records.length,
      activeReminders: user.patientProfile.reminders.length,
      activePrescriptions: user.patientProfile.records.filter(r => r.type === 'PRESCRIPTION').length,
      healthScore: Math.min(100, 60 + (user.patientProfile.records.length * 5))
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};
