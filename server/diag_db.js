import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const MONGO_URI = process.env.MONGO_URI;

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const User = mongoose.model('User', new mongoose.Schema({}), 'users');
    const PatientProfile = mongoose.model('PatientProfile', new mongoose.Schema({ userId: String }), 'patientprofiles');

    const targetId = '6a0468f0077a89669978293f';
    
    const user = await User.findById(targetId);
    console.log('User exists:', !!user);
    if (user) console.log('User data:', JSON.stringify(user, null, 2));

    const profile = await PatientProfile.findOne({ userId: targetId });
    console.log('Profile exists:', !!profile);
    if (profile) console.log('Profile data:', JSON.stringify(profile, null, 2));

    if (!profile && user) {
        console.log('Attempting to create profile manually...');
        const newProfile = await PatientProfile.create({ userId: targetId });
        console.log('Profile created manually:', !!newProfile);
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
