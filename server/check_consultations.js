import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: 'c:/Users/riyan/OneDrive/Documents/Medilite-Chain/server/.env' });

const consultationSchema = new mongoose.Schema({
  patientId: String,
  symptoms: String,
});

const userSchema = new mongoose.Schema({
  name: String,
  clerkId: String,
});

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const Consultation = mongoose.model('Consultation', consultationSchema);
  const User = mongoose.model('User', userSchema);

  const consultations = await Consultation.find({}).lean();
  console.log('--- Consultations ---');
  for (const c of consultations) {
    const patient = await User.findById(c.patientId).lean() || await User.findOne({ clerkId: c.patientId }).lean();
    console.log(`ID: ${c._id}, PatientId: ${c.patientId}, Symptoms: ${c.symptoms}, Found Patient: ${patient ? patient.name : 'NO'}`);
  }

  process.exit();
}

check();
