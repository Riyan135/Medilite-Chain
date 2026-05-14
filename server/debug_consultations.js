import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/medilite";

const consultationSchema = new mongoose.Schema({}, { strict: false });
const userSchema = new mongoose.Schema({}, { strict: false });
const appointmentSchema = new mongoose.Schema({}, { strict: false });

const Consultation = mongoose.model('Consultation', consultationSchema);
const User = mongoose.model('User', userSchema);
const Appointment = mongoose.model('Appointment', appointmentSchema);

async function debug() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const consultations = await Consultation.find({}).lean();
    console.log(`Found ${consultations.length} consultations`);

    for (const cons of consultations) {
      const patientId = cons.patientId;
      const patient = await User.findById(patientId);
      
      if (!patient) {
        console.log(`[ALERT] Consultation ${cons._id} has INVALID patientId: ${patientId}`);
        // Check if it's a Clerk ID or something else
        const clerkUser = await User.findOne({ clerkId: patientId });
        if (clerkUser) {
          console.log(`  -> Found user by clerkId! Correct _id should be: ${clerkUser._id}`);
        } else {
          console.log(`  -> Could not find user by clerkId either.`);
        }
      } else {
        console.log(`[OK] Consultation ${cons._id} -> Patient: ${patient.name} (${patient._id})`);
      }
    }

    const appointments = await Appointment.find({}).lean();
    console.log(`\nFound ${appointments.length} appointments`);
    for (const appt of appointments) {
      const patientUserId = appt.patientUserId;
      const patient = await User.findById(patientUserId);

      if (!patient) {
        console.log(`[ALERT] Appointment ${appt._id} has INVALID patientUserId: ${patientUserId}`);
        const clerkUser = await User.findOne({ clerkId: patientUserId });
        if (clerkUser) {
          console.log(`  -> Found user by clerkId! Correct _id should be: ${clerkUser._id}`);
        }
      } else {
        console.log(`[OK] Appointment ${appt._id} -> Patient: ${patient.name}`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Debug error:', error);
    process.exit(1);
  }
}

debug();
