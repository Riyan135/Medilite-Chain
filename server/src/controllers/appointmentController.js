import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import PatientProfile from '../models/PatientProfile.js';
import { createConsultationFromAppointment } from './consultationController.js';

const emitAppointmentEvent = (req, room, eventName, appointment) => {
  const io = req.app.get('io');
  if (io && room) {
    io.to(room).emit(eventName, appointment);
  }
};

const logReminder = (message) => {
  console.log(`[Reminder] ${message}`);
};

const toDoctorSummary = (doctor) => ({
  id: doctor._id.toString(),
  name: doctor.name,
  email: doctor.email,
});

const toPatientSummary = (patient) => ({
  user: {
    id: patient._id.toString(),
    name: patient.name,
    email: patient.email,
  },
});

const hydrateAppointment = async (appointment) => {
  const value = appointment.toObject ? appointment.toObject() : { ...appointment };
  const [doctor, patient] = await Promise.all([
    User.findById(value.doctorId).select('_id name email').lean(),
    User.findById(value.patientUserId).select('_id name email').lean(),
  ]);

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
      .select('_id name email')
      .sort({ name: 1 })
      .lean();

    res.json(doctors.map(toDoctorSummary));
  } catch (error) {
    console.error('Error fetching doctors for appointments:', error);
    res.status(500).json({ error: error.message });
  }
};

export const createAppointment = async (req, res) => {
  try {
    const { doctorId, date, time, reason } = req.body;

    if (!doctorId || !date || !time) {
      return res.status(400).json({ error: 'Doctor, date, and time are required' });
    }

    const [doctor, patient, patientProfile] = await Promise.all([
      User.findById(doctorId).lean(),
      User.findById(req.user.id).lean(),
      PatientProfile.findOne({ userId: req.user.id }).lean(),
    ]);

    if (!doctor || doctor.role !== 'DOCTOR') {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    if (!patient || !patientProfile) {
      return res.status(404).json({ error: 'Patient profile not found' });
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
      patientUserId: req.user.id,
      doctorId,
      date,
      time,
      reason: reason?.trim() || null,
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

    if (appointment.doctorId !== req.user.id) {
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
    const appointments = await Appointment.find({
      doctorId: req.user.id,
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
