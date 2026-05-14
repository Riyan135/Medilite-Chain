import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import PatientProfile from '../models/PatientProfile.js';
import { createConsultationFromAppointment } from './consultationController.js';

const resolvePatient = async (id) => {
  if (!id) return null;
  let p = null;
  try {
    p = await User.findById(id).lean();
  } catch (err) {}
  if (!p) p = await User.findOne({ clerkId: id }).lean();
  return p;
};

const emitAppointmentEvent = (req, room, eventName, appointment) => {
  const io = req.app.get('io');
  if (io && room) {
    io.to(room).emit(eventName, appointment);
  }
};

const logReminder = (message) => {
  console.log(`[Reminder] ${message}`);
};

const APPOINTMENT_TYPES = new Set(['CLINIC_VISIT', 'VIDEO_CALL', 'CHAT_CONSULTATION', 'EMERGENCY']);
const APPOINTMENT_TIME_SLOTS = [
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '02:00 PM',
  '02:30 PM',
  '03:00 PM',
  '03:30 PM',
  '04:00 PM',
  '04:30 PM',
];

const parseMedicalIntake = (intake) => {
  if (!intake || typeof intake !== 'object') {
    return null;
  }

  const reportLinks = Array.isArray(intake.reportLinks)
    ? intake.reportLinks.map((item) => String(item || '').trim()).filter(Boolean)
    : String(intake.reportLinks || '')
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);

  return {
    symptoms: intake.symptoms?.trim?.() || null,
    illnessDuration: intake.illnessDuration?.trim?.() || null,
    allergies: intake.allergies?.trim?.() || null,
    currentMedicines: intake.currentMedicines?.trim?.() || null,
    pastMedicalHistory: {
      diabetes: Boolean(intake.pastMedicalHistory?.diabetes),
      bloodPressure: Boolean(intake.pastMedicalHistory?.bloodPressure),
      asthma: Boolean(intake.pastMedicalHistory?.asthma),
      heartDisease: Boolean(intake.pastMedicalHistory?.heartDisease),
      kidneyDisease: Boolean(intake.pastMedicalHistory?.kidneyDisease),
      liverDisease: Boolean(intake.pastMedicalHistory?.liverDisease),
      other: intake.pastMedicalHistory?.other?.trim?.() || null,
    },
    pregnancyStatus: ['NOT_APPLICABLE', 'NO', 'PREGNANT', 'BREASTFEEDING', 'UNSURE'].includes(intake.pregnancyStatus)
      ? intake.pregnancyStatus
      : 'NOT_APPLICABLE',
    reportLinks,
  };
};

const toDoctorSummary = (doctor) => ({
  id: doctor._id.toString(),
  name: doctor.name,
  email: doctor.email,
  specialization: doctor.specialization || null,
});

const toPatientSummary = (patient) => ({
  user: {
    id: patient._id.toString(),
    name: patient.name,
    email: patient.email,
    age: patient.age || null,
    gender: patient.gender || null,
    dateOfBirth: patient.dateOfBirth || null,
    phone: patient.phone || null,
  },
});

const hydrateAppointment = async (appointment) => {
  const value = appointment.toObject ? appointment.toObject() : { ...appointment };
  let [doctor, patient] = await Promise.all([
    User.findById(value.doctorId).select('_id name email specialization').lean(),
    User.findById(value.patientUserId).select('_id name email age gender dateOfBirth phone').lean(),
  ]);

  if (!patient && value.patientUserId) {
    patient = await User.findOne({ clerkId: value.patientUserId }).select('_id name email age gender dateOfBirth phone').lean();
  }

  return {
    ...value,
    id: value._id.toString(),
    doctor: doctor ? toDoctorSummary(doctor) : null,
    patient: patient ? toPatientSummary(patient) : null,
  };
};

export const getDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ role: 'DOCTOR', isVerified: true })
      .select('_id name email specialization')
      .sort({ name: 1 })
      .lean();

    res.json(doctors.map(toDoctorSummary));
  } catch (error) {
    console.error('Error fetching doctors for appointments:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getAppointmentAvailability = async (req, res) => {
  try {
    const doctorId = req.query.doctorId?.trim();
    const dates = req.query.dates
      ?.split(',')
      .map((date) => date.trim())
      .filter(Boolean);

    if (!doctorId || !dates?.length) {
      return res.status(400).json({ error: 'Doctor and dates are required' });
    }

    const doctor = await User.findById(doctorId).select('_id role').lean();
    if (!doctor || doctor.role !== 'DOCTOR') {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const appointments = await Appointment.find({
      doctorId,
      date: { $in: dates },
      status: { $in: ['PENDING', 'ACCEPTED'] },
    })
      .select('date time status')
      .lean();

    const availability = dates.map((date) => {
      const bookedSlots = appointments
        .filter((appointment) => appointment.date === date)
        .map((appointment) => appointment.time);
      const uniqueBookedSlots = [...new Set(bookedSlots)];
      const availableSlots = APPOINTMENT_TIME_SLOTS.filter((slot) => !uniqueBookedSlots.includes(slot));

      return {
        date,
        totalSlots: APPOINTMENT_TIME_SLOTS.length,
        bookedSlots: uniqueBookedSlots,
        availableSlots,
        availableCount: availableSlots.length,
        bookedCount: uniqueBookedSlots.length,
      };
    });

    res.json({ availability });
  } catch (error) {
    console.error('Error fetching appointment availability:', error);
    res.status(500).json({ error: error.message });
  }
};

export const createAppointment = async (req, res) => {
  try {
    const { doctorId, date, time, reason, appointmentType, medicalIntake, patientId } = req.body;

    if (!doctorId || !date || !time) {
      return res.status(400).json({ error: 'Doctor, date, and time are required' });
    }

    if (appointmentType && !APPOINTMENT_TYPES.has(appointmentType)) {
      return res.status(400).json({ error: 'Invalid appointment type' });
    }

    const targetId = (patientId && patientId !== 'undefined') ? patientId : req.user.id;
    let targetPatient = await resolvePatient(targetId);
    
    if (!targetPatient && (targetId === req.user.id || targetId === req.user.clerkId)) {
       targetPatient = req.user;
    }

    if (!targetPatient) {
      // Final attempt: maybe the ID is valid but resolvePatient missed it
      targetPatient = await User.findById(req.user.id).lean();
      if (!targetPatient) targetPatient = req.user;
    }

    const finalPatientId = targetPatient?._id?.toString() || targetPatient?.id;

    // Verify patient authorization
    const isSelf = finalPatientId === req.user.id || (targetPatient && targetPatient.clerkId === req.user.clerkId);
    
    if (!isSelf) {
      const isFamilyMember = await User.exists({ _id: finalPatientId, parentId: req.user.id });
      if (!isFamilyMember) {
        // If doctor is booking for themselves, bypass
        if (req.user.role !== 'DOCTOR') {
          return res.status(403).json({ error: 'Unauthorized to book for this patient' });
        }
      }
    }

    const [doctor, patientProfile] = await Promise.all([
      User.findById(doctorId).lean(),
      PatientProfile.findOne({ userId: finalPatientId }).lean(),
    ]);
    const patient = targetPatient;

    if (!doctor || doctor.role !== 'DOCTOR') {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    let finalProfile = patientProfile;
    if (!finalProfile) {
      console.log('CREATING ON-THE-FLY PROFILE FOR:', finalPatientId);
      finalProfile = await PatientProfile.create({
        userId: finalPatientId,
        bloodGroup: 'Unknown',
        emergencyContact: { name: 'Self', phone: patient.phone || 'N/A', relation: 'Self' }
      });
    }

    const conflictingAppointment = await Appointment.findOne({
      doctorId,
      date,
      time,
      status: { $in: ['PENDING', 'ACCEPTED'] },
    }).lean();

    if (conflictingAppointment) {
      return res.status(400).json({ error: 'Doctor is not available at that time. Please choose another slot.' });
    }

    const appointment = await Appointment.create({
      patientUserId: finalPatientId,
      doctorId,
      date,
      time,
      appointmentType: appointmentType || 'CLINIC_VISIT',
      reason: reason?.trim() || null,
      medicalIntake: parseMedicalIntake(medicalIntake),
      status: 'PENDING',
    });

    const hydratedAppointment = await hydrateAppointment(appointment);
    emitAppointmentEvent(req, doctorId, 'incoming_appointment', hydratedAppointment);
    logReminder(`Appointment requested by ${patient.name} with Dr. ${doctor.name} on ${date} at ${time}.`);

    res.status(201).json(hydratedAppointment);
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['ACCEPTED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid appointment status' });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appointment.doctorId !== req.user.id && req.user.role !== 'ADMIN' && req.user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({ error: 'You can only update your own appointments' });
    }

    if (status === 'ACCEPTED') {
      const conflictingAppointment = await Appointment.findOne({
        _id: { $ne: appointment._id },
        doctorId: appointment.doctorId,
        date: appointment.date,
        time: appointment.time,
        status: 'ACCEPTED',
      }).lean();

      if (conflictingAppointment) {
        return res.status(400).json({ error: 'This time slot is already booked. Please reject this request.' });
      }
    }

    appointment.status = status;
    await appointment.save();

    if (status === 'ACCEPTED') {
      await createConsultationFromAppointment(appointment);
      logReminder(`Appointment confirmed for patient ${appointment.patientUserId} on ${appointment.date} at ${appointment.time}.`);
    }

    const hydratedAppointment = await hydrateAppointment(appointment);
    emitAppointmentEvent(req, appointment.patientUserId, 'appointment_status_changed', hydratedAppointment);

    res.json(hydratedAppointment);
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getDoctorPendingAppointments = async (req, res) => {
  try {
    const doctorId = (req.user.role === 'ADMIN' || req.user.role === 'SYSTEM_ADMIN') ? (req.query.doctorId || req.user.id) : req.user.id;
    const appointments = await Appointment.find({
      doctorId: doctorId,
      status: 'PENDING',
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json(await Promise.all(appointments.map((appointment) => hydrateAppointment(appointment))));
  } catch (error) {
    console.error('Error fetching doctor pending appointments:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id).lean();

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const canAccess =
      req.user.role === 'ADMIN' ||
      appointment.doctorId === req.user.id ||
      appointment.patientUserId === req.user.id;

    if (!canAccess) {
      return res.status(403).json({ error: 'Not allowed to view this appointment' });
    }

    res.json(await hydrateAppointment(appointment));
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getAppointmentHistory = async (req, res) => {
  try {
    const query = {};

    if (req.user.role === 'DOCTOR') {
      query.doctorId = req.user.id;
    } else if (req.user.role === 'PATIENT') {
      query.patientUserId = req.user.id;
    } else if (req.user.role === 'ADMIN' || req.user.role === 'SYSTEM_ADMIN') {
      if (req.query.doctorId) query.doctorId = req.query.doctorId;
      if (req.query.patientUserId) query.patientUserId = req.query.patientUserId;
    }

    const appointments = await Appointment.find(query).sort({ createdAt: -1 }).lean();
    res.json(await Promise.all(appointments.map((appointment) => hydrateAppointment(appointment))));
  } catch (error) {
    console.error('Error fetching appointment history:', error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id).lean();

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const canDelete =
      req.user.role === 'ADMIN' ||
      appointment.doctorId === req.user.id;

    if (!canDelete) {
      return res.status(403).json({ error: 'Not allowed to delete this appointment' });
    }

    await Appointment.findByIdAndDelete(id);
    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ error: error.message });
  }
};
