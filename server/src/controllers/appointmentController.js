import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Get list of verified doctors
export const getDoctors = async (req, res) => {
  try {
    const doctors = await prisma.user.findMany({
      where: { role: 'DOCTOR', isVerified: true },
      select: { id: true, name: true, email: true }
    });
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new appointment (Patient action)
export const createAppointment = async (req, res) => {
  try {
    const { doctorId, date, time, reason } = req.body;
    
    // Attempt to find existing patient profile
    let patientProfile = await prisma.patientProfile.findUnique({
      where: { userId: req.user.id }
    });
    
    // If no profile, we can auto-create one for convenience in this booking flow
    if (!patientProfile) {
      patientProfile = await prisma.patientProfile.create({
        data: { userId: req.user.id }
      });
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId: patientProfile.id,
        doctorId,
        date,
        time,
        reason,
        status: "PENDING"
      },
      include: {
        doctor: { select: { name: true } },
        patient: { include: { user: { select: { id: true, name: true } } } }
      }
    });

    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update status of appointment (Doctor action)
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status },
      include: {
        patient: { include: { user: { select: { id: true, name: true } } } },
        doctor: { select: { id: true, name: true } }
      }
    });
    
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get pending appointments (Doctor)
export const getDoctorPendingAppointments = async (req, res) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { doctorId: req.user.id, status: "PENDING" },
      include: {
        patient: { include: { user: { select: { name: true, email: true } } } }
      }
    });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
