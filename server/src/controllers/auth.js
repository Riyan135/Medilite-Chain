import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import PatientProfile from '../models/PatientProfile.js';
import { sendDoctorIdEmail, sendOtpEmail } from '../services/mailer.js';
import { generatePatientQR } from './patient.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_fallback_secret_for_dev_only';

const toAuthUser = (user) => ({
  id: user._id.toString(),
  email: user.email,
  name: user.name,
  phone: user.phone || null,
  role: user.role,
  doctorId: user.doctorId || null,
  specialization: user.specialization || null,
  profileImageUrl: user.profileImageUrl || null,
  clerkId: user.clerkId || null,
});

const markPortalLogin = async (user) => {
  user.lastPortalLoginAt = new Date();
  user.portalLoginCount = (user.portalLoginCount || 0) + 1;
  await user.save();
};

const otpStore = new Map();
const doctorSignupStore = new Map();

const buildDoctorEmail = (name) => {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');

  return `${slug || 'doctor'}@medilite-doctor.local`;
};

const buildDoctorPortalEmailPreview = (email) => {
  if (!email) return 'your registered email';

  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return email;

  const visibleLocal = localPart.length <= 2 ? `${localPart[0] || ''}*` : `${localPart.slice(0, 2)}***`;
  return `${visibleLocal}@${domain}`;
};

const buildDoctorNameFromEmail = (email) =>
  email
    .split('@')[0]
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Doctor';

const buildPortalToken = (user) =>
  jwt.sign({ id: user._id.toString() }, JWT_SECRET, { expiresIn: '7d' });

const isConfiguredAdminEmail = (email) => {
  const configuredAdminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return Boolean(configuredAdminEmail && email === configuredAdminEmail);
};

const generateDoctorIdCandidate = () => `DOC-${crypto.randomInt(100000, 999999)}`;

const ensureDoctorId = async (user) => {
  if (user.doctorId) {
    return user.doctorId;
  }

  let doctorId = generateDoctorIdCandidate();
  while (await User.exists({ doctorId })) {
    doctorId = generateDoctorIdCandidate();
  }

  user.doctorId = doctorId;
  await user.save();
  return doctorId;
};

export const register = async (req, res) => {
  const { email, password, name, phone, bloodGroup } = req.body;

  try {
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedName = name?.trim();

    if (!normalizedName || !normalizedEmail || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: normalizedEmail,
      password: hashedPassword,
      name: normalizedName,
      phone: phone?.trim() || null,
      role: 'PATIENT',
    });

    await PatientProfile.create({
      userId: user._id.toString(),
      bloodGroup: bloodGroup || null,
      consultingDoctorId: null,
      qrCode: await generatePatientQR(user._id.toString()),
    });

    const token = buildPortalToken(user);
    res.status(201).json({ user: toAuthUser(user), token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
};

export const login = async (req, res) => {
  let { email, name, password } = req.body;

  try {
    if (email) email = email.trim().toLowerCase();
    if (name) name = name.trim();

    let user = null;
    if (email) {
      user = await User.findOne({ email });
    } else if (name) {
      user = await User.findOne({ name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
    }

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ error: 'Your account has been blocked by the administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    await markPortalLogin(user);

    if (user.role === 'PATIENT') {
      const profile = await PatientProfile.findOne({ userId: user._id.toString() });
      if (profile && !profile.qrCode) {
        const qrCode = await generatePatientQR(user._id.toString());
        await PatientProfile.updateOne({ userId: user._id.toString() }, { $set: { qrCode } });
      }
    }

    const token = buildPortalToken(user);
    res.status(200).json({ user: toAuthUser(user), token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Failed to sign in' });
  }
};

export const staffLogin = async (req, res) => {
  let { name, password } = req.body;

  try {
    if (name) name = name.trim();

    if (!name || !password) {
      return res.status(400).json({ error: 'Name and password are required' });
    }

    if (!/^\d{4}$/.test(password)) {
      return res.status(400).json({ error: 'Password must be exactly 4 digits' });
    }

    let user = await User.findOne({
      name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
    });

    if (!user) {
      user = await User.create({
        name,
        email: buildDoctorEmail(name),
        password: await bcrypt.hash(password, 10),
        role: 'DOCTOR',
        isVerified: true,
      });
    } else {
      if (user.isBlocked) {
        return res.status(403).json({ error: 'Your account has been blocked by the administrator.' });
      }
      
      if (user.role === 'ADMIN') {
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(400).json({ error: 'Invalid name or password' });
        }
      } else {
        user.password = await bcrypt.hash(password, 10);
        user.role = 'DOCTOR';
        user.isVerified = true;
      }
    }

    await markPortalLogin(user);

    if (user.role === 'PATIENT') {
      const profile = await PatientProfile.findOne({ userId: user._id.toString() });
      if (profile && !profile.qrCode) {
        const qrCode = await generatePatientQR(user._id.toString());
        await PatientProfile.updateOne({ userId: user._id.toString() }, { $set: { qrCode } });
      }
    }

    const token = buildPortalToken(user);
    res.status(200).json({ user: toAuthUser(user), token });
  } catch (error) {
    console.error('Staff login error:', error);
    res.status(500).json({ error: error.message || 'Failed to sign in' });
  }
};

export const requestDoctorOtp = async (req, res) => {
  const doctorId = req.body.doctorId?.trim().toUpperCase();
  const name = req.body.name?.trim();
  const email = req.body.email?.trim().toLowerCase();

  try {
    if (!doctorId || !name || !email) {
      console.log('Doctor OTP Request Missing Fields:', { doctorId, name, email });
      return res.status(400).json({ error: 'Doctor ID, doctor name, and email are required' });
    }

    const user = await User.findOne({ doctorId, role: 'DOCTOR' });
    console.log('Doctor OTP Request User Lookup:', user ? 'Found User' : 'Not Found', { doctorId });

    if (!user) {
      return res.status(404).json({
        error: 'Doctor ID not found. Please create a doctor account first.',
        signupRequired: true,
      });
    }

    const isNameMatch = user.name?.trim().toLowerCase() === name.toLowerCase();
    const isEmailMatch = user.email?.trim().toLowerCase() === email;

    console.log('Doctor OTP Match Check:', { 
      inputName: name, 
      dbName: user.name, 
      isNameMatch,
      inputEmail: email,
      dbEmail: user.email,
      isEmailMatch 
    });

    if (!isNameMatch || !isEmailMatch) {
      return res.status(400).json({ error: 'Doctor ID, doctor name, and email do not match our records' });
    }

    const otp = String(crypto.randomInt(1000, 10000));
    otpStore.set(`doctor:${doctorId}`, {
      otp,
      doctorId,
      email: user.email,
      name: user.name,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    await sendOtpEmail({
      to: user.email,
      name: user.name,
      otp,
    });
    console.log('Doctor OTP sent successfully to:', user.email);

    res.status(200).json({
      message: 'Doctor OTP sent successfully',
      doctorId,
      emailPreview: buildDoctorPortalEmailPreview(user.email),
    });
  } catch (error) {
    console.error('Doctor OTP request error:', error);
    if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKET' || error.code === 'ECONNECTION' || error.code === 'ECONNRESET') {
      const storeKey = `doctor:${doctorId}`;
      const entry = otpStore.get(storeKey);
      if (entry) {
        entry.otp = '1234';
        otpStore.set(storeKey, entry);
      }
      return res.status(200).json({
        message: 'SMTP blocked. Bypassing email.',
        doctorId,
        emailPreview: 'SMTP Blocked (Use OTP 1234)',
        emailFailed: true
      });
    }
    res.status(500).json({ error: error.message || 'Failed to send doctor OTP' });
  }
};

export const verifyDoctorOtp = async (req, res) => {
  const doctorId = req.body.doctorId?.trim().toUpperCase();
  const otp = req.body.otp?.trim();

  try {
    if (!doctorId || !otp) {
      return res.status(400).json({ error: 'Doctor ID and OTP are required' });
    }

    const storeKey = `doctor:${doctorId}`;
    const entry = otpStore.get(storeKey);
    if (!entry || entry.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    if (entry.expiresAt < Date.now()) {
      otpStore.delete(storeKey);
      return res.status(400).json({ error: 'OTP expired' });
    }

    const user = await User.findOne({ doctorId, role: 'DOCTOR' });
    if (!user) {
      otpStore.delete(storeKey);
      return res.status(404).json({ error: 'Doctor account not found' });
    }

    otpStore.delete(storeKey);
    await markPortalLogin(user);

    const token = buildPortalToken(user);
    res.status(200).json({ user: toAuthUser(user), token });
  } catch (error) {
    console.error('Doctor OTP verify error:', error);
    res.status(500).json({ error: 'Failed to verify doctor OTP' });
  }
};

export const requestDoctorSignupOtp = async (req, res) => {
  const name = req.body.name?.trim();
  const email = req.body.email?.trim().toLowerCase();
  const phone = req.body.phone?.trim();
  const specialization = req.body.specialization?.trim();
  const password = req.body.password?.trim();

  try {
    if (!name || !email || !phone || !specialization || !password) {
      return res.status(400).json({ error: 'Name, email, phone, specialization, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { phone, role: 'DOCTOR' }],
    });

    if (existingUser?.role === 'DOCTOR') {
      const doctorId = await ensureDoctorId(existingUser);
      return res.status(400).json({
        error: `Doctor account already exists. Please use Doctor ID ${doctorId} to log in.`,
        doctorId,
      });
    }

    const otp = String(crypto.randomInt(1000, 10000));
    doctorSignupStore.set(`doctor-signup:${email}`, {
      otp,
      name,
      email,
      phone,
      specialization,
      password,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    await sendOtpEmail({
      to: email,
      name: name,
      otp,
    });

    res.status(200).json({ message: 'Doctor sign-up OTP sent successfully' });
  } catch (error) {
    console.error('Doctor sign-up OTP request error:', error);
    if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKET' || error.code === 'ECONNECTION' || error.code === 'ECONNRESET') {
      const storeKey = `doctor-signup:${email}`;
      const entry = doctorSignupStore.get(storeKey);
      if (entry) {
        entry.otp = '1234';
        doctorSignupStore.set(storeKey, entry);
      }
      return res.status(200).json({
        message: 'SMTP blocked. Bypassing email. Use OTP 1234.',
        emailFailed: true
      });
    }
    res.status(500).json({ error: error.message || 'Failed to send sign-up OTP' });
  }
};

export const verifyDoctorSignupOtp = async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const otp = req.body.otp?.trim();

  try {
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const storeKey = `doctor-signup:${email}`;
    const entry = doctorSignupStore.get(storeKey);

    if (!entry || entry.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    if (entry.expiresAt < Date.now()) {
      doctorSignupStore.delete(storeKey);
      return res.status(400).json({ error: 'OTP expired' });
    }

    const duplicate = await User.findOne({ email: entry.email });
    if (duplicate?.role === 'DOCTOR') {
      const existingDoctorId = await ensureDoctorId(duplicate);
      doctorSignupStore.delete(storeKey);
      return res.status(400).json({
        error: `Doctor account already exists. Use Doctor ID ${existingDoctorId} to log in.`,
        doctorId: existingDoctorId,
      });
    }

    const user =
      duplicate ||
      new User({
        email: entry.email,
        password: await bcrypt.hash(crypto.randomUUID(), 10),
      });

    user.name = entry.name;
    user.phone = entry.phone;
    user.specialization = entry.specialization;
    user.password = await bcrypt.hash(entry.password, 10);
    user.role = 'DOCTOR';
    user.isVerified = true;

    await user.save();
    const doctorId = await ensureDoctorId(user);
    await sendDoctorIdEmail({
      to: entry.email,
      name: entry.name,
      doctorId,
    });

    doctorSignupStore.delete(storeKey);
    await markPortalLogin(user);

    const token = buildPortalToken(user);
    res.status(201).json({
      user: toAuthUser(user),
      token,
      doctorId,
      message: 'Doctor account created successfully',
    });
  } catch (error) {
    console.error('Doctor sign-up OTP verify error:', error);
    res.status(500).json({ error: error.message || 'Failed to create doctor account' });
  }
};

export const requestOtp = async (req, res) => {
  const { name, email, phone } = req.body;

  try {
    const normalizedName = name?.trim();
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedPhone = phone?.trim();

    if (!normalizedName || !normalizedEmail || !normalizedPhone) {
      return res.status(400).json({ error: 'Name, email, and phone are required' });
    }

    const otp = String(crypto.randomInt(1000, 10000));
    otpStore.set(normalizedEmail, {
      otp,
      name: normalizedName,
      phone: normalizedPhone,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    await sendOtpEmail({
      to: normalizedEmail,
      name: normalizedName,
      otp,
    });

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Patient OTP request error:', error);
    if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKET' || error.code === 'ECONNECTION' || error.code === 'ECONNRESET') {
      const storeKey = `patient:${normalizedEmail}`;
      const entry = otpStore.get(storeKey);
      if (entry) {
        entry.otp = '1234';
        otpStore.set(storeKey, entry);
      }
      return res.status(200).json({
        message: 'SMTP blocked. Bypassing email. Use OTP 1234.',
        emailFailed: true
      });
    }
    res.status(500).json({ error: error.message || 'Failed to send OTP' });
  }
};

export const requestStaffOtp = async (req, res) => {
  const { name, email } = req.body;

  try {
    const normalizedName = name?.trim();
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedName || !normalizedEmail) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const otp = String(crypto.randomInt(1000, 10000));
    otpStore.set(`staff:${normalizedEmail}`, {
      otp,
      name: normalizedName,
      email: normalizedEmail,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    await sendOtpEmail({
      to: normalizedEmail,
      name: normalizedName,
      otp,
    });

    res.status(200).json({ message: 'Staff OTP sent successfully' });
  } catch (error) {
    console.error('Staff OTP request error:', error);
    res.status(500).json({ error: error.message || 'Failed to send OTP' });
  }
};

export const verifyOtp = async (req, res) => {
  const { name, email, phone, otp } = req.body;

  try {
    const normalizedName = name?.trim();
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedPhone = phone?.trim();
    const normalizedOtp = otp?.trim();

    if (!normalizedName || !normalizedEmail || !normalizedPhone || !normalizedOtp) {
      return res.status(400).json({ error: 'Name, email, phone, and OTP are required' });
    }

    const entry = otpStore.get(normalizedEmail);
    if (!entry || entry.otp !== normalizedOtp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    if (entry.expiresAt < Date.now()) {
      otpStore.delete(normalizedEmail);
      return res.status(400).json({ error: 'OTP expired' });
    }

    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      user = await User.create({
        email: normalizedEmail,
        password: await bcrypt.hash(crypto.randomUUID(), 10),
        name: normalizedName,
        phone: normalizedPhone,
        role: 'PATIENT',
      });

      await PatientProfile.create({
        userId: user._id.toString(),
        bloodGroup: null,
        consultingDoctorId: null,
        qrCode: await generatePatientQR(user._id.toString()),
      });
    } else {
      user.name = normalizedName;
      user.phone = normalizedPhone;
      await user.save();
    }

    otpStore.delete(normalizedEmail);
    await markPortalLogin(user);

    const token = buildPortalToken(user);
    res.status(200).json({ user: toAuthUser(user), token });
  } catch (error) {
    console.error('OTP verify error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
};

export const verifyStaffOtp = async (req, res) => {
  const { name, email, otp } = req.body;

  try {
    const normalizedName = name?.trim();
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedOtp = otp?.trim();

    if (!normalizedName || !normalizedEmail || !normalizedOtp) {
      return res.status(400).json({ error: 'Name, email and OTP are required' });
    }

    const storeKey = `staff:${normalizedEmail}`;
    const entry = otpStore.get(storeKey);
    if (!entry || entry.otp !== normalizedOtp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    if (entry.expiresAt < Date.now()) {
      otpStore.delete(storeKey);
      return res.status(400).json({ error: 'OTP expired' });
    }

    let user = await User.findOne({ email: normalizedEmail });
    const shouldBeAdmin = isConfiguredAdminEmail(normalizedEmail);

    if (!user) {
      user = await User.create({
        email: normalizedEmail,
        password: await bcrypt.hash(crypto.randomUUID(), 10),
        name: normalizedName,
        role: shouldBeAdmin ? 'ADMIN' : 'DOCTOR',
        isVerified: true,
      });
    } else {
      if (shouldBeAdmin) {
        user.role = 'ADMIN';
      } else if (user.role !== 'ADMIN') {
        user.role = 'DOCTOR';
      }

      user.isVerified = true;
      user.name = normalizedName;
      await user.save();
    }

    otpStore.delete(storeKey);
    if (user.role === 'DOCTOR') {
      await ensureDoctorId(user);
    }
    await markPortalLogin(user);

    const token = buildPortalToken(user);
    res.status(200).json({ user: toAuthUser(user), token });
  } catch (error) {
    console.error('Staff OTP verify error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
};

export const syncUser = async (req, res) => {
  const { clerkId, email, name, role, phone } = req.body;

  try {
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail || !name?.trim()) {
      return res.status(400).json({ error: 'Email and name are required' });
    }

    const update = {
      clerkId: clerkId || null,
      email: normalizedEmail,
      name: name.trim(),
      phone: phone?.trim() || null,
      role: role || 'PATIENT',
    };

    let user = await User.findOne({ email: normalizedEmail });
    if (user) {
      Object.assign(user, update);
      await user.save();
    } else {
      user = await User.create({
        ...update,
        password: 'OAUTH_USER_NO_PASSWORD',
      });
    }

    if (user.role === 'PATIENT') {
      await PatientProfile.updateOne(
        { userId: user._id.toString() },
        { 
          $setOnInsert: { 
            userId: user._id.toString(),
            qrCode: await generatePatientQR(user._id.toString())
          } 
        },
        { upsert: true }
      );
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({ error: 'Failed to sync user' });
  }
};

export const getAdminId = async (req, res) => {
  try {
    const admin = await User.findOne({ role: 'ADMIN' }).select('_id');
    if (!admin) {
      return res.status(404).json({ error: 'No admin found' });
    }
    res.json({ id: admin._id.toString() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ role: 'DOCTOR' }).select('_id name phone doctorId specialization').lean();
    res.status(200).json(
      doctors.map((doctor) => ({
        id: doctor._id.toString(),
        name: doctor.name,
        phone: doctor.phone,
        doctorId: doctor.doctorId || null,
        specialization: doctor.specialization || null,
      }))
    );
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
};
