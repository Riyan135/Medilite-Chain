import pkg from '@prisma/client';
import { generateHealthOverview } from '../services/aiService.js';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

export const searchPatients = async (req, res) => {
  const { query } = req.query;

  try {
    const patients = await prisma.user.findMany({
      where: {
        role: 'PATIENT',
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } }
        ]
      },
      include: {
        patientProfile: true
      }
    });

    res.status(200).json(patients);
  } catch (error) {
    console.error('Error searching patients:', error);
    res.status(500).json({ error: 'Failed to search patients' });
  }
};

export const getPatientDetailsForDoctor = async (req, res) => {
  const { id } = req.params;

  try {
    const patient = await prisma.user.findUnique({
      where: { id },
      include: {

        patientProfile: {
          include: {
            records: true,
            notes: {
              orderBy: { date: 'desc' }
            }
          }
        }
      }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.status(200).json(patient);
  } catch (error) {
    console.error('Error fetching patient details:', error);
    res.status(500).json({ error: 'Failed to fetch patient details' });
  }
};

export const addDoctorNote = async (req, res) => {
  const { patientProfileId, content, title } = req.body;
  const doctorId = req.user.id;


  try {
    const doctor = await prisma.user.findUnique({
      where: { id: doctorId }
    });


    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const note = await prisma.doctorNote.create({
      data: {
        title: title || 'Consultation Note',
        note: content,
        date: new Date(),
        patientId: patientProfileId,
        doctorId: doctor.id
      }
    });

    res.status(201).json(note);
  } catch (error) {
    console.error('Error adding doctor note:', error);
    res.status(500).json({ error: 'Failed to add doctor note' });
  }
};

export const getRecentConsultations = async (req, res) => {
  const id = req.user.id;


  try {
    const doctor = await prisma.user.findUnique({
      where: { id }
    });


    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const recentNotes = await prisma.doctorNote.findMany({
      where: { doctorId: doctor.id },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: {
          include: {
            user: true
          }
        }
      }
    });

    // Extract unique patients from notes
    const patients = recentNotes.map(n => n.patient.user);
    const uniquePatients = Array.from(new Map(patients.map(p => [p.id, p])).values());

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
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        patientProfile: {
          include: {
            records: true
          }
        }
      }
    });

    if (!user || !user.patientProfile) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    const records = user.patientProfile.records;
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
