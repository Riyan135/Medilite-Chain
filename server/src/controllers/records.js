import pkg from '@prisma/client';
import { summarizeReport, generateHealthOverview } from '../services/aiService.js';

import QRCode from 'qrcode';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();


export const uploadRecord = async (req, res) => {
  const { title, type, description, doctorId } = req.body;
  const patientId = req.body.patientId || req.user.id;

  const fileUrl = req.file?.path;

  if (!fileUrl) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    // First, find the user by id to get their PatientProfile
    const user = await prisma.user.findUnique({
      where: { id: patientId },
      include: { patientProfile: true }
    });


    if (!user || !user.patientProfile) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    const record = await prisma.medicalRecord.create({
      data: {
        title,
        type,
        fileUrl,
        description,
        patientId: user.patientProfile.id,
        doctorId: doctorId || null,
        date: new Date(),
      },
    });

    res.status(201).json(record);
  } catch (error) {
    console.error('Error creating medical record:', error);
    res.status(500).json({ error: 'Failed to create medical record' });
  }
};

export const getPatientRecords = async (req, res) => {
  const patientId = req.params.patientId || req.user.id;


  try {
    const user = await prisma.user.findUnique({
      where: { id: patientId },
      include: { patientProfile: true }
    });


    if (!user || !user.patientProfile) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    const records = await prisma.medicalRecord.findMany({
      where: { patientId: user.patientProfile.id },
      orderBy: { date: 'desc' },
      include: {
        doctor: {
          select: { name: true }
        }
      }
    });

    res.status(200).json(records);
  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).json({ error: 'Failed to fetch medical records' });
  }
};

export const deleteRecord = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.medicalRecord.delete({
      where: { id }
    });
    res.status(200).json({ message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Error deleting record:', error);
    res.status(500).json({ error: 'Failed to delete record' });
  }
};

export const summarizeRecord = async (req, res) => {
  const { id } = req.params;
  const { language } = req.body;

  try {
    const record = await prisma.medicalRecord.findUnique({
      where: { id: id }
    });

    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    const summary = await summarizeReport(record.fileUrl, record.type, language);

    // Update record with the new summary
    const updatedRecord = await prisma.medicalRecord.update({
      where: { id: id },
      data: { summary: summary }
    });

    res.status(200).json(updatedRecord);
  } catch (error) {
    console.error('Error summarizing record:', error);
    res.status(500).json({ error: 'Failed to summarize record' });
  }
};

export const generateRecordQR = async (req, res) => {
  const { id } = req.params;

  try {
    const record = await prisma.medicalRecord.findUnique({
      where: { id: id }
    });

    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    // In a real app, this would be a signed URL or a temporary token
    const qrData = JSON.stringify({
      recordId: record.id,
      patientId: record.patientId,
      timestamp: Date.now()
    });

    const qrCodeImage = await QRCode.toDataURL(qrData);
    res.status(200).json({ qrCode: qrCodeImage });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
};

export const getHealthOverview = async (req, res) => {
  const userId = req.user.id;
  const { language } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    const overview = await generateHealthOverview(records, language);
    res.status(200).json(overview);
  } catch (error) {
    console.error('Error generating health overview:', error);
    res.status(500).json({ error: 'Failed to generate health overview' });
  }
};


