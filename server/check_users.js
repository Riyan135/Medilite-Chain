import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: 'c:/Users/riyan/OneDrive/Documents/Medilite-Chain/server/.env' });

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const userSchema = new mongoose.Schema({ name: String, email: String, role: String });
  const User = mongoose.model('User', userSchema);

  const users = await User.find({ name: /Riyan/i }).lean();
  console.log('--- Riyan Users ---');
  users.forEach(u => console.log(`ID: ${u._id}, Name: ${u.name}, Email: ${u.email}, Role: ${u.role}`));
  
  process.exit();
}

check();
