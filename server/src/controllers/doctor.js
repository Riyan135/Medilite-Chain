import { generateHealthOverview } from '../services/aiService.js';
import Consultation from '../models/Consultation.js';
import MedicalRecord from '../models/MedicalRecord.js';
import PatientProfile from '../models/PatientProfile.js';
import User from '../models/User.js';

export const searchPatients = async (req, res) => {
  const { query } = req.query;

  try {
    const searchRegex = new RegExp(query, 'i');
    const patients = await User.find({
      role: 'PATIENT',
      $or: [{ name: searchRegex }, { email: searchRegex }],
    })
      .sort({ name: 1 })
      .lean();

    res.status(200).json(
      patients.map((patient) => ({
        ...patient,
        id: patient._id.toString(),
      }))
    );
  } catch (error) {
    console.error('Error searching patients:', error);
    res.status(500).json({ error: 'Failed to search patients' });
  }
};

export const getPatientDetailsForDoctor = async (req, res) => {
  const { id } = req.params;

  try {
    const [patient, patientProfile, records, consultations] = await Promise.all([
      User.findById(id).lean(),
      PatientProfile.findOne({ userId: id }).lean(),
      MedicalRecord.find({ patientUserId: id }).sort({ date: -1 }).lean(),
      Consultation.find({ patientId: id, doctorId: req.user.id }).sort({ createdAt: -1 }).lean(),
    ]);

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.status(200).json({
      ...patient,
      id: patient._id.toString(),
      patientProfile: {
        ...(patientProfile || {}),
        id: patientProfile?._id?.toString?.(),
        records: records.map((record) => ({
          ...record,
          id: record._id.toString(),
        })),
        notes: consultations.map((consultation) => ({
          id: consultation._id.toString(),
          title: consultation.diagnosis || 'Consultation Note',
          note: consultation.notes || consultation.symptoms || 'No notes added yet',
          date: consultation.updatedAt || consultation.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching patient details:', error);
    res.status(500).json({ error: 'Failed to fetch patient details' });
  }
};

export const addDoctorNote = async (req, res) => {
  const { patientProfileId, content, title } = req.body;
  const doctorId = req.user.id;

  try {
    const doctor = await User.findById(doctorId).lean();
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const profile = await PatientProfile.findById(patientProfileId).lean();
    if (!profile) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    const note = await Consultation.create({
      patientId: profile.userId,
      doctorId: doctor._id.toString(),
      diagnosis: title || 'Consultation Note',
      notes: content,
      consultationType: 'ONLINE_CHAT',
      status: 'COMPLETED',
      startedAt: new Date(),
      completedAt: new Date(),
    });

    res.status(201).json({
      id: note._id.toString(),
      title: note.diagnosis,
      note: note.notes,
      date: note.completedAt,
    });
  } catch (error) {
    console.error('Error adding doctor note:', error);
    res.status(500).json({ error: 'Failed to add doctor note' });
  }
};

export const getRecentConsultations = async (req, res) => {
  const id = req.user.id;

  try {
    const doctor = await User.findById(id).lean();
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const recentConsultations = await Consultation.find({ doctorId: doctor._id.toString() })
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean();
    const patientIds = [...new Set(recentConsultations.map((consultation) => consultation.patientId))];
    const patients = await User.find({ _id: { $in: patientIds } }).lean();
    const uniquePatients = patients.map((patient) => ({
      ...patient,
      id: patient._id.toString(),
    }));

    res.status(200).json(uniquePatients);
  } catch (error) {
    console.error('Error fetching recent consultations:', error);
    res.status(500).json({ error: 'Failed to fetch recent consultations' });
  }
};

export const getPatientHealthOverview = async (req, res) => {
  const { id } = req.params;
  const { language } = req.body;

  try {
    const [user, records] = await Promise.all([
      User.findById(id).lean(),
      MedicalRecord.find({ patientUserId: id }).sort({ date: -1 }).lean(),
    ]);

    if (!user) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    if (records.length === 0) {
      return res.status(400).json({ error: 'No medical records found to summarize.' });
    }

    const overview = await generateHealthOverview(records, language || 'English');
    res.status(200).json(overview);
  } catch (error) {
    console.error('Error generating health overview:', error);
    res.status(500).json({ error: 'Failed to generate health overview' });
  }
};
