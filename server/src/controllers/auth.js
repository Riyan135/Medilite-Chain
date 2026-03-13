import pkg from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your_fallback_secret_for_dev_only';

export const register = async (req, res) => {
  const { email, password, name, phone } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        role: 'PATIENT',
        patientProfile: {
          create: {
            consultingDoctorId: req.body.doctorId || undefined
          }
        }
      },
    });

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ user: { id: user.id, email, name, role: user.role }, token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ user: { id: user.id, email: user.email, name: user.name, role: user.role }, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to sign in' });
  }
};

export const syncUser = async (req, res) => {
  // Keeping this for compatibility or future use, but primary auth is now local
  const { clerkId, email, name, role, phone } = req.body;

  try {
    const user = await prisma.user.upsert({
      where: { email }, // Switch to email as primary key for syncing since clerkId is optional
      update: { clerkId, name, role, phone },
      create: {
        clerkId,
        email,
        password: 'OAUTH_USER_NO_PASSWORD', // Placeholder for OAuth users
        name,
        phone,
        role: role || 'PATIENT',
        patientProfile: role === 'PATIENT' ? {
          create: {}
        } : undefined
      },
    });

    res.status(200).json(user);
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({ error: 'Failed to sync user' });
  }
};

export const getAdminId = async (req, res) => {
  try {
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true }
    });
    if (!admin) return res.status(404).json({ error: 'No admin found' });
    res.json({ id: admin.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getDoctors = async (req, res) => {
  try {
    const doctors = await prisma.user.findMany({
      where: { role: 'DOCTOR' },
      select: { id: true, name: true, phone: true }
    });
    res.status(200).json(doctors);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
};
