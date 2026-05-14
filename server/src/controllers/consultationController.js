import Appointment from '../models/Appointment.js';
import Consultation from '../models/Consultation.js';
import User from '../models/User.js';
import { reconcilePrescriptionStock } from '../services/medicineStock.js';
import { buildPrescriptionPdf } from '../services/prescriptionPdf.js';
import { sendWhatsApp } from '../services/sms.js';
import { sendPrescriptionReadyEmail } from '../services/mailer.js';

const createShareToken = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;

const resolvePatient = async (id) => {
  if (!id) return null;
  let p = null;
  try {
    p = await User.findById(id).lean();
  } catch (err) {
    // Not a valid MongoDB ID, ignore and try clerkId
  }
  if (!p) p = await User.findOne({ clerkId: id }).lean();
  return p;
};

const toUserSummary = (user) =>
  user
    ? {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        age: user.age || null,
        gender: user.gender || null,
        dateOfBirth: user.dateOfBirth || null,
        specialization: user.specialization || null,
        medicalLicenseNumber: user.medicalLicenseNumber || null,
        digitalSignatureUrl: user.digitalSignatureUrl || null,
        digitalSignatureName: user.digitalSignatureName || null,
      }
    : null;

const hydrateConsultation = async (consultation) => {
  const value = consultation.toObject ? consultation.toObject() : { ...consultation };

  let [patient, doctor, appointment] = await Promise.all([
    resolvePatient(value.patientId),
    User.findById(value.doctorId).select('_id name email phone specialization medicalLicenseNumber digitalSignatureUrl digitalSignatureName').lean(),
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
    symptoms: appointment.medicalIntake?.symptoms || appointment.reason || null,
    medicalIntake: appointment.medicalIntake || null,
  });
};

export const createConsultation = async (req, res) => {
  try {
    const { doctorId, symptoms, notes, consultationType, scheduledDate, scheduledTime, patientId, medicalIntake } = req.body;
    let finalPatientId = patientId;

    let patient = await resolvePatient(patientId);

    if (req.user.role === 'PATIENT') {
      const targetId = patient?._id?.toString() || finalPatientId || req.user.id;
      
      // If we haven't loaded the patient yet (e.g. targetId was req.user.id), load it now
      if (!patient || patient._id.toString() !== targetId) {
        patient = await resolvePatient(targetId);
        if (!patient && targetId === req.user.id) {
            // This should not happen as req.user is loaded from DB
            patient = req.user;
        }
      }

      const isSelf = targetId === req.user.id || 
                    (patient && patient.clerkId && patient.clerkId === req.user.clerkId) ||
                    (finalPatientId === req.user.clerkId) ||
                    (finalPatientId === req.user.id) ||
                    (patient && patient.email === req.user.email);
      
      if (!isSelf) {
        const isFamilyMember = await User.exists({ 
          $or: [
            { _id: targetId, parentId: req.user.id },
            { clerkId: targetId, parentId: req.user.id }
          ]
        });
        if (!isFamilyMember) {
           return res.status(403).json({ error: 'Unauthorized to create consultation for this patient' });
        }
      }
      finalPatientId = targetId;
    } else {
      finalPatientId = patient?._id?.toString() || finalPatientId;
    }

    // Only default to req.user.id if the user is a PATIENT
    if (!finalPatientId && req.user.role === 'PATIENT') {
      finalPatientId = req.user.id;
    }
    if (!doctorId) doctorId = req.user.id; // Fallback to self for testing

    const consultation = await Consultation.create({
      patientId: finalPatientId,
      doctorId,
      symptoms: symptoms?.trim() || null,
      notes: notes?.trim() || null,
      consultationType: consultationType || 'ONLINE_CHAT',
      scheduledDate: scheduledDate || null,
      scheduledTime: scheduledTime || null,
      medicalIntake: medicalIntake || null,
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
    const requestedPatientId = req.query.patientId;

    if (req.user.role === 'PATIENT') {
      const targetId = requestedPatientId || req.user.id;
      if (targetId !== req.user.id) {
        const isFamilyMember = await User.exists({ _id: targetId, parentId: req.user.id });
        if (!isFamilyMember) {
          // Robust identity check: MongoDB ID or Clerk ID
          const isSelf = targetId === req.user.id || (req.user.clerkId && targetId === req.user.clerkId);
          if (!isSelf) {
            console.log(`AUTH_DEBUG: 403 in getConsultations. targetId: ${targetId}, UserId: ${req.user.id}, Role: ${req.user.role}, ClerkId: ${req.user.clerkId}`);
            return res.status(403).json({ error: 'Unauthorized to view consultations for this patient' });
          }
        }
      }
      query.patientId = targetId;
    } else if (req.user.role === 'DOCTOR') {
      if (requestedPatientId) {
        query.patientId = requestedPatientId;
      } else {
        query.doctorId = req.user.id;
      }
    } else if (req.user.role === 'ADMIN' || req.user.role === 'SYSTEM_ADMIN') {
      const requestedDoctorId = req.query.doctorId;
      if (requestedDoctorId) {
        query.doctorId = requestedDoctorId;
      } else if (requestedPatientId) {
        query.patientId = requestedPatientId;
      }
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

const sendPrescriptionPdfResponse = async (res, consultation) => {
  const hydrated = await hydrateConsultation(consultation);
  const pdf = await buildPrescriptionPdf(hydrated);
  const patientName = hydrated.patient?.name || 'patient';
  const fileName = `MediLite-Prescription-${patientName.replace(/[^a-z0-9]+/gi, '-')}.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.setHeader('Content-Length', pdf.length);
  res.send(pdf);
};

export const downloadPrescriptionPdf = async (req, res) => {
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
      return res.status(403).json({ error: 'Not allowed to download this prescription' });
    }

    return sendPrescriptionPdfResponse(res, consultation);
  } catch (error) {
    console.error('Error downloading prescription PDF:', error);
    res.status(500).json({ error: 'Failed to download prescription PDF' });
  }
};

export const downloadSharedPrescriptionPdf = async (req, res) => {
  try {
    const consultation = await Consultation.findOne({
      _id: req.params.id,
      prescriptionShareToken: req.params.token,
    }).lean();

    if (!consultation) {
      return res.status(404).json({ error: 'Prescription link is invalid or expired' });
    }

    return sendPrescriptionPdfResponse(res, consultation);
  } catch (error) {
    console.error('Error downloading shared prescription PDF:', error);
    res.status(500).json({ error: 'Failed to download prescription PDF' });
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
    if (!consultation.prescriptionShareToken) {
      consultation.prescriptionShareToken = createShareToken();
    }
    if (req.body.diagnosis !== undefined) {
      consultation.diagnosis = req.body.diagnosis?.trim() || null;
    }
    if (req.body.notes !== undefined) {
      consultation.notes = req.body.notes?.trim() || null;
    }
    consultation.status = 'COMPLETED';
    consultation.completedAt = new Date();
    if (!consultation.startedAt) {
      consultation.startedAt = new Date();
    }
    await consultation.save();
    await reconcilePrescriptionStock({
      previousPrescription,
      nextPrescription: consultation.prescription,
      consultationId: consultation._id.toString(),
      actorUserId: req.user.id,
    });

    const hydratedConsultation = await hydrateConsultation(consultation);
    const publicServerUrl = process.env.PUBLIC_SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;
    const prescriptionUrl = `${publicServerUrl.replace(/\/$/, '')}/api/public/consultations/${consultation._id}/prescription/${consultation.prescriptionShareToken}.pdf`;

    sendWhatsApp({
      to: hydratedConsultation.patient?.phone,
      body: `MediLite: Your prescription from Dr. ${hydratedConsultation.doctor?.name || 'Doctor'} is ready. Download PDF: ${prescriptionUrl}`,
      mediaUrl: prescriptionUrl,
    }).catch((error) => {
      console.error('Failed to send prescription WhatsApp:', error.message);
    });

    sendPrescriptionReadyEmail({
      to: hydratedConsultation.patient?.email,
      patientName: hydratedConsultation.patient?.name,
      doctorName: hydratedConsultation.doctor?.name,
      prescriptionUrl,
    }).catch((error) => {
      console.error('Failed to send prescription email:', error.message);
    });

    const io = req.app.get('io');
    if (io) {
      io.to(consultation.patientId).emit('prescription_ready', hydratedConsultation);
    }

    res.json({
      ...hydratedConsultation,
      prescriptionUrl,
    });
  } catch (error) {
    console.error('Error adding prescription:', error);
    res.status(500).json({ error: 'Failed to add prescription' });
  }
};

export const getConsultationStats = async (req, res) => {
  try {
    const query = {};
    const requestedPatientId = req.query.patientId;

    if (req.user.role === 'PATIENT') {
      const targetId = requestedPatientId || req.user.id;
      if (targetId !== req.user.id) {
        const isFamilyMember = await User.exists({ _id: targetId, parentId: req.user.id });
        if (!isFamilyMember) {
          // Robust identity check: MongoDB ID or Clerk ID
          const isSelf = targetId === req.user.id || (req.user.clerkId && targetId === req.user.clerkId);
          if (!isSelf) {
            console.log(`AUTH_DEBUG: 403 in getConsultationStats. targetId: ${targetId}, UserId: ${req.user.id}, Role: ${req.user.role}, ClerkId: ${req.user.clerkId}`);
            return res.status(403).json({ error: 'Unauthorized to view consultation stats for this patient' });
          }
        }
      }
      query.patientId = targetId;
    } else if (req.user.role === 'DOCTOR') {
      if (requestedPatientId) {
        query.patientId = requestedPatientId;
      } else {
        query.doctorId = req.user.id;
      }
    } else if (req.user.role === 'ADMIN' || req.user.role === 'SYSTEM_ADMIN') {
      const requestedDoctorId = req.query.doctorId;
      if (requestedDoctorId) {
        query.doctorId = requestedDoctorId;
      } else if (requestedPatientId) {
        query.patientId = requestedPatientId;
      }
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
