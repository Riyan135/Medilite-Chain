import jwt from 'jsonwebtoken';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_fallback_secret_for_dev_only');

    // In this app, we might be using clerkId or a standard userId
    // Let's check both if needed, but usually it's the id (uuid)
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        patientProfile: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Insert user data into request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};
