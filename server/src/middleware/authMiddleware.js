import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import PatientProfile from '../models/PatientProfile.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_fallback_secret_for_dev_only');

    const user = await User.findById(decoded.id).lean();
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const patientProfile = await PatientProfile.findOne({ userId: user._id.toString() }).lean();

    req.user = {
      ...user,
      id: user._id.toString(),
      patientProfile,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};
