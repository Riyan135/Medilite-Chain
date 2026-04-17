import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import PatientProfile from '../models/PatientProfile.js';
import { sendDoctorIdEmail, sendOtpEmail } from '../services/mailer.js';
import { ensureDoctorId } from '../services/doctorIdentity.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_fallback_secret_for_dev_only';
const AUTH_COOKIE_NAME = 'medilite_auth';
const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const toAuthUser = (user) => ({
  id: user._id.toString(),
  email: user.email,
  name: user.name,
  role: user.role,
  doctorId: user.doctorId || null,
  specialization: user.specialization || null,
});

const markPortalLogin = async (user) => {
  user.lastPortalLoginAt = new Date();
  user.portalLoginCount = (user.portalLoginCount || 0) + 1;
  await user.save();
};

const otpStore = new Map();
const doctorSignupStore = new Map();
const patientSignupStore = new Map();

const getAuthCookieOptions = (req) => {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const isSecureRequest = req.secure || forwardedProto === 'https';
  const configuredSameSite = process.env.AUTH_COOKIE_SAME_SITE?.trim();
  const sameSite = configuredSameSite || (isSecureRequest ? 'none' : 'lax');
  const secure = sameSite === 'none' ? true : isSecureRequest;

  return {
    httpOnly: true,
    sameSite,
    secure,
    maxAge: AUTH_COOKIE_MAX_AGE,
    path: '/',
  };
};

const setAuthCookie = (req, res, token) => {
  res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions(req));
};

const clearAuthCookie = (req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, {
    ...getAuthCookieOptions(req),
    expires: new Date(0),
  });
};

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

    const otp = String(crypto.randomInt(1000, 10000));
    patientSignupStore.set(`patient-signup:${normalizedEmail}`, {
      name: normalizedName,
      email: normalizedEmail,
      phone: phone?.trim() || null,
      bloodGroup: bloodGroup || null,
      password,
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    await sendOtpEmail({
      to: normalizedEmail,
      name: normalizedName,
      otp,
    });

    res.status(200).json({
      message: 'Signup OTP sent successfully',
      email: normalizedEmail,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
};

export const verifyRegisterOtp = async (req, res) => {
  const normalizedEmail = req.body.email?.trim().toLowerCase();
  const normalizedOtp = req.body.otp?.trim();

  try {
    if (!normalizedEmail || !normalizedOtp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const storeKey = `patient-signup:${normalizedEmail}`;
    const entry = patientSignupStore.get(storeKey);

    if (!entry || entry.otp !== normalizedOtp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    if (entry.expiresAt < Date.now()) {
      patientSignupStore.delete(storeKey);
      return res.status(400).json({ error: 'OTP expired' });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      patientSignupStore.delete(storeKey);
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(entry.password, 10);
    const user = await User.create({
      email: entry.email,
      password: hashedPassword,
      name: entry.name,
      phone: entry.phone,
      role: 'PATIENT',
    });

    await PatientProfile.create({
      userId: user._id.toString(),
      bloodGroup: entry.bloodGroup,
      consultingDoctorId: null,
    });

    patientSignupStore.delete(storeKey);
    await markPortalLogin(user);

    const token = buildPortalToken(user);
    setAuthCookie(req, res, token);
    res.status(201).json({
      user: toAuthUser(user),
      token,
      message: 'Account created successfully',
    });
  } catch (error) {
    console.error('Signup OTP verification error:', error);
    res.status(500).json({ error: 'Failed to verify signup OTP' });
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

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    await markPortalLogin(user);
    const token = buildPortalToken(user);
    setAuthCookie(req, res, token);
    res.status(200).json({ user: toAuthUser(user), token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to sign in' });
  }
};

export const staffLogin = async (req, res) => {
  try {
    res.status(403).json({ error: 'Legacy staff login is disabled. Doctors must log in with their Doctor ID.' });
  } catch (error) {
    console.error('Staff login error:', error);
    res.status(500).json({ error: 'Failed to sign in' });
  }
};

export const requestDoctorOtp = async (req, res) => {
  const doctorId = req.body.doctorId?.trim().toUpperCase();

  try {
    if (!doctorId) {
      return res.status(400).json({ error: 'Doctor ID is required' });
    }

    const user = await User.findOne({ doctorId, role: 'DOCTOR' });
    if (!user) {
      return res.status(404).json({
        error: 'Doctor ID not found. Please contact the system admin.',
      });
    }

    if (!user.email?.trim()) {
      return res.status(400).json({ error: 'Doctor account is missing an email address. Please contact the system admin.' });
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

    res.status(200).json({
      message: 'Doctor OTP sent successfully',
      doctorId,
      doctorName: user.name,
      emailPreview: buildDoctorPortalEmailPreview(user.email),
    });
  } catch (error) {
    console.error('Doctor OTP request error:', error);
    res.status(500).json({ error: error.message || 'Failed to send doctor OTP' });
  }
};

export const loginDoctorWithId = async (req, res) => {
  const doctorId = req.body.doctorId?.trim().toUpperCase();

  try {
    if (!doctorId) {
      return res.status(400).json({ error: 'Doctor ID is required' });
    }

    const user = await User.findOne({ doctorId, role: 'DOCTOR' });
    if (!user) {
      return res.status(404).json({ error: 'Doctor ID not found. Please contact the system admin.' });
    }

    await markPortalLogin(user);

    const token = buildPortalToken(user);
    setAuthCookie(req, res, token);
    res.status(200).json({
      user: toAuthUser(user),
      token,
      message: 'Doctor login successful',
    });
  } catch (error) {
    console.error('Doctor ID login error:', error);
    res.status(500).json({ error: 'Failed to sign in with Doctor ID' });
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
    setAuthCookie(req, res, token);
    res.status(200).json({ user: toAuthUser(user), token });
  } catch (error) {
    console.error('Doctor OTP verify error:', error);
    res.status(500).json({ error: 'Failed to verify doctor OTP' });
  }
};

export const requestDoctorSignupOtp = async (req, res) => {
  try {
    res.status(403).json({ error: 'Doctor accounts are created by the system admin only.' });
  } catch (error) {
    console.error('Doctor sign-up OTP request error:', error);
    res.status(500).json({ error: error.message || 'Failed to send sign-up OTP' });
  }
};

export const verifyDoctorSignupOtp = async (req, res) => {
  try {
    res.status(403).json({ error: 'Doctor accounts are created by the system admin only.' });
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
    console.error('OTP request error:', error);
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

    const existingAdmin = await User.findOne({ email: normalizedEmail, role: 'ADMIN' }).lean();
    if (!isConfiguredAdminEmail(normalizedEmail) && !existingAdmin) {
      return res.status(403).json({ error: 'Only system admin accounts can access this portal' });
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
      });
    } else {
      user.name = normalizedName;
      user.phone = normalizedPhone;
      await user.save();
    }

    otpStore.delete(normalizedEmail);
    await markPortalLogin(user);

    const token = buildPortalToken(user);
    setAuthCookie(req, res, token);
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

    if (!shouldBeAdmin && user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only system admin accounts can access this portal' });
    }

    if (!user) {
      user = await User.create({
        email: normalizedEmail,
        password: await bcrypt.hash(crypto.randomUUID(), 10),
        name: normalizedName,
        role: 'ADMIN',
        isVerified: true,
      });
    } else {
      if (shouldBeAdmin) {
        user.role = 'ADMIN';
      } else if (user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Only system admin accounts can access this portal' });
      }

      user.isVerified = true;
      user.name = normalizedName;
      await user.save();
    }

    otpStore.delete(storeKey);
    await markPortalLogin(user);

    const token = buildPortalToken(user);
    setAuthCookie(req, res, token);
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
        { $setOnInsert: { userId: user._id.toString() } },
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

export const getCurrentUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    res.status(200).json({ user: toAuthUser(req.user) });
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ error: 'Failed to fetch current user' });
  }
};

export const logout = async (req, res) => {
  try {
    clearAuthCookie(req, res);
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Failed to log out' });
  }
};
