import Appointment from '../models/Appointment.js';
import Consultation from '../models/Consultation.js';
import User from '../models/User.js';
import { reconcilePrescriptionStock } from '../services/medicineStock.js';

const toUserSummary = (user) =>
  user
    ? {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        specialization: user.specialization || null,
      }
    : null;

const hydrateConsultation = async (consultation) => {
  const value = consultation.toObject ? consultation.toObject() : { ...consultation };
  const [patient, doctor, appointment] = await Promise.all([
    User.findById(value.patientId).select('_id name email phone').lean(),
    User.findById(value.doctorId).select('_id name email phone specialization').lean(),
    value.appointmentId ? Appointment.findById(value.appointmentId).lean() : null,
  ]);

  return {
    ...value,
    id: value._id.toString(),
    patient: toUserSummary(patient),
    doctor: toUserSummary(doctor),
    appointment: appointment
      ? {
          id: appointment._id.toString(),
          date: appointment.date,
          time: appointment.time,
          appointmentType: appointment.appointmentType || 'CLINIC_VISIT',
          status: appointment.status,
        }
      : null,
  };
};

const parsePrescription = (prescription = []) =>
  Array.isArray(prescription)
    ? prescription
        .filter((item) => item?.medicine && item?.dosage && item?.duration)
        .map((item) => ({
          medicine: item.medicine.trim(),
          quantity: Math.max(1, Number.parseInt(item.quantity, 10) || 1),
          dosage: item.dosage.trim(),
          duration: item.duration.trim(),
          instructions: item.instructions?.trim() || null,
        }))
    : [];

export const createConsultationFromAppointment = async (appointment) => {
  const existing = await Consultation.findOne({ appointmentId: appointment._id.toString() });
  if (existing) {
    return existing;
  }

  return Consultation.create({
    appointmentId: appointment._id.toString(),
    patientId: appointment.patientUserId,
    doctorId: appointment.doctorId,
    consultationType: appointment.appointmentType === 'VIDEO_CALL'
      ? 'VIDEO_CALL'
      : appointment.appointmentType === 'CHAT_CONSULTATION'
        ? 'ONLINE_CHAT'
        : 'IN_PERSON',
    status: 'PENDING',
    scheduledDate: appointment.date,
    scheduledTime: appointment.time,
    notes: appointment.reason || null,
  });
};

export const createConsultation = async (req, res) => {
  try {
    const patientId = req.user.role === 'PATIENT' ? req.user.id : req.body.patientId;
    const { doctorId, symptoms, notes, consultationType, scheduledDate, scheduledTime } = req.body;

    if (!patientId || !doctorId) {
      return res.status(400).json({ error: 'Patient and doctor are required' });
    }

    const [patient, doctor] = await Promise.all([
      User.findById(patientId).lean(),
      User.findById(doctorId).lean(),
    ]);

    if (!patient || patient.role !== 'PATIENT') {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (!doctor || doctor.role !== 'DOCTOR') {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const consultation = await Consultation.create({
      patientId,
      doctorId,
      symptoms: symptoms?.trim() || null,
      notes: notes?.trim() || null,
      consultationType: consultationType || 'ONLINE_CHAT',
      scheduledDate: scheduledDate || null,
      scheduledTime: scheduledTime || null,
      status: 'PENDING',
    });

    const hydratedConsultation = await hydrateConsultation(consultation);
    const io = req.app.get('io');
    if (io) {
      io.to(doctorId).emit('consultation_created', hydratedConsultation);
    }

    res.status(201).json(hydratedConsultation);
  } catch (error) {
    console.error('Error creating consultation:', error);
    res.status(500).json({ error: 'Failed to create consultation' });
  }
};

export const getConsultations = async (req, res) => {
  try {
    const query = {};

    if (req.user.role === 'DOCTOR') {
      query.doctorId = req.user.id;
    } else if (req.user.role === 'PATIENT') {
      query.patientId = req.user.id;
    } else if (req.user.role === 'ADMIN' && req.headers['x-app-type'] !== 'admin') {
      query.patientId = req.user.id;
    }

    const consultations = await Consultation.find(query).sort({ createdAt: -1 }).lean();
    res.json(await Promise.all(consultations.map((consultation) => hydrateConsultation(consultation))));
  } catch (error) {
    console.error('Error fetching consultations:', error);
    res.status(500).json({ error: 'Failed to fetch consultations' });
  }
};

export const getConsultationById = async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id).lean();

    if (!consultation) {
      return res.status(404).json({ error: 'Consultation not found' });
    }

    const canAccess =
      req.user.role === 'ADMIN' ||
      consultation.doctorId === req.user.id ||
      consultation.patientId === req.user.id;

    if (!canAccess) {
      return res.status(403).json({ error: 'Not allowed to view this consultation' });
    }

    res.json(await hydrateConsultation(consultation));
  } catch (error) {
    console.error('Error fetching consultation:', error);
    res.status(500).json({ error: 'Failed to fetch consultation' });
  }
};

export const updateConsultation = async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
      return res.status(404).json({ error: 'Consultation not found' });
    }

    if (req.user.role !== 'ADMIN' && consultation.doctorId !== req.user.id) {
      return res.status(403).json({ error: 'Only the assigned doctor can update this consultation' });
    }

    const nextStatus = req.body.status || consultation.status;
    if (!['PENDING', 'ONGOING', 'COMPLETED'].includes(nextStatus)) {
      return res.status(400).json({ error: 'Invalid consultation status' });
    }

    consultation.symptoms = req.body.symptoms?.trim?.() ?? consultation.symptoms;
    consultation.diagnosis = req.body.diagnosis?.trim?.() ?? consultation.diagnosis;
    consultation.notes = req.body.notes?.trim?.() ?? consultation.notes;
    consultation.consultationType = req.body.consultationType || consultation.consultationType;
    consultation.status = nextStatus;

    if (nextStatus === 'ONGOING' && !consultation.startedAt) {
      consultation.startedAt = new Date();
    }

    if (nextStatus === 'COMPLETED') {
      consultation.completedAt = new Date();
      if (!consultation.startedAt) {
        consultation.startedAt = new Date();
      }
    }

    const previousPrescription = consultation.prescription || [];
    if (req.body.prescription) {
      consultation.prescription = parsePrescription(req.body.prescription);
    }

    await consultation.save();
    if (req.body.prescription) {
      await reconcilePrescriptionStock({
        previousPrescription,
        nextPrescription: consultation.prescription,
        consultationId: consultation._id.toString(),
        actorUserId: req.user.id,
      });
    }
    res.json(await hydrateConsultation(consultation));
  } catch (error) {
    console.error('Error updating consultation:', error);
    res.status(500).json({ error: 'Failed to update consultation' });
  }
};

export const addPrescription = async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
      return res.status(404).json({ error: 'Consultation not found' });
    }

    if (req.user.role !== 'ADMIN' && consultation.doctorId !== req.user.id) {
      return res.status(403).json({ error: 'Only the assigned doctor can add a prescription' });
    }

    const previousPrescription = consultation.prescription || [];
    consultation.prescription = parsePrescription(req.body.prescription);
    if (req.body.diagnosis !== undefined) {
      consultation.diagnosis = req.body.diagnosis?.trim() || null;
    }
    if (req.body.notes !== undefined) {
      consultation.notes = req.body.notes?.trim() || null;
    }
    await consultation.save();
    await reconcilePrescriptionStock({
      previousPrescription,
      nextPrescription: consultation.prescription,
      consultationId: consultation._id.toString(),
      actorUserId: req.user.id,
    });

    res.json(await hydrateConsultation(consultation));
  } catch (error) {
    console.error('Error adding prescription:', error);
    res.status(500).json({ error: 'Failed to add prescription' });
  }
};

export const getConsultationStats = async (req, res) => {
  try {
    const query = {};
    if (req.user.role === 'DOCTOR') {
      query.doctorId = req.user.id;
    } else if (req.user.role === 'PATIENT') {
      query.patientId = req.user.id;
    }

    const [total, pending, ongoing, completed] = await Promise.all([
      Consultation.countDocuments(query),
      Consultation.countDocuments({ ...query, status: 'PENDING' }),
      Consultation.countDocuments({ ...query, status: 'ONGOING' }),
      Consultation.countDocuments({ ...query, status: 'COMPLETED' }),
    ]);

    res.json({ total, pending, ongoing, completed });
  } catch (error) {
    console.error('Error fetching consultation stats:', error);
    res.status(500).json({ error: 'Failed to fetch consultation stats' });
  }
};
