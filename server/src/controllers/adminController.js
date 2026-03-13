import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

export const getAllPatients = async (req, res) => {
  try {
    const patients = await prisma.user.findMany({
      where: { role: 'PATIENT' },
      include: {
        patientProfile: {
          include: {
            records: true,
            consultingDoctor: true
          }
        }
      }
    });
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPatientDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await prisma.user.findUnique({
      where: { id },
      include: {
        patientProfile: {
          include: {
            records: true,
            reminders: true,
            inventory: true,
            notes: {
                include: { doctor: true }
            },
            consultingDoctor: true
          }
        }
      }
    });
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const assignDoctor = async (req, res) => {
  try {
    const { patientId, doctorId } = req.body;
    // patientId is the User ID of the patient
    const user = await prisma.user.findUnique({
        where: { id: patientId },
        include: { patientProfile: true }
    });

    if (!user || !user.patientProfile) {
        return res.status(404).json({ error: 'Patient profile not found' });
    }

    const updatedProfile = await prisma.patientProfile.update({
      where: { id: user.patientProfile.id },
      data: { consultingDoctorId: doctorId }
    });
    res.json(updatedProfile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllDoctors = async (req, res) => {
    try {
        const doctors = await prisma.user.findMany({
            where: { role: 'DOCTOR' }
        });
        res.json(doctors);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
