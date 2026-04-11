import QRCode from 'qrcode';

import MedicalRecord from '../models/MedicalRecord.js';
import PatientProfile from '../models/PatientProfile.js';
import User from '../models/User.js';
import { summarizeReport, generateHealthOverview } from '../services/aiService.js';

const withDoctorName = async (record) => {
  const result = record.toObject ? record.toObject() : { ...record };
  result.id = result._id.toString();

  if (result.doctorId) {
    const doctor = await User.findById(result.doctorId).select('name').lean();
    result.doctor = doctor ? { name: doctor.name } : null;
  } else {
    result.doctor = null;
  }

  return result;
};

export const uploadRecord = async (req, res) => {
  const { title, type, description, doctorId } = req.body;
  const patientId = req.body.patientId || req.user.id;
  const fileUrl = req.file?.path;

  if (!fileUrl) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const patientProfile = await PatientProfile.findOne({ userId: patientId }).lean();

    if (!patientProfile) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    const record = await MedicalRecord.create({
      patientUserId: patientId,
      doctorId: doctorId || null,
      title: title?.trim() || 'Untitled Record',
      type: type || 'REPORT',
      description: description?.trim() || null,
      fileUrl,
      date: new Date(),
    });

    res.status(201).json(await withDoctorName(record));
  } catch (error) {
    console.error('Error creating medical record:', error);
    res.status(500).json({ error: 'Failed to create medical record' });
  }
};

export const getPatientRecords = async (req, res) => {
  const patientId = req.params.patientId || req.user.id;

  try {
    const patientProfile = await PatientProfile.findOne({ userId: patientId }).lean();

    if (!patientProfile) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    const records = await MedicalRecord.find({ patientUserId: patientId }).sort({ date: -1 }).lean();
    const hydratedRecords = await Promise.all(records.map((record) => withDoctorName(record)));

    res.status(200).json(hydratedRecords);
  } catch (error) {
    console.error('Error fetching records:', error);
    res.status(500).json({ error: 'Failed to fetch medical records' });
  }
};

export const deleteRecord = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedRecord = await MedicalRecord.findByIdAndDelete(id).lean();
    if (!deletedRecord) {
      return res.status(404).json({ error: 'Record not found' });
    }

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
    const record = await MedicalRecord.findById(id);

    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    const summary = await summarizeReport(record.fileUrl, record.type, language);
    record.summary = summary;
    await record.save();

    res.status(200).json(await withDoctorName(record));
  } catch (error) {
    console.error('Error summarizing record:', error);
    res.status(500).json({ error: 'Failed to summarize record' });
  }
};

export const generateRecordQR = async (req, res) => {
  const { id } = req.params;

  try {
    const record = await MedicalRecord.findById(id).lean();

    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    const qrData = JSON.stringify({
      recordId: record._id.toString(),
      patientId: record.patientUserId,
      timestamp: Date.now(),
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
    const records = await MedicalRecord.find({ patientUserId: userId }).lean();

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
