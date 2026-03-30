import express from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Add a family member
router.post('/', async (req, res) => {
  try {
    const { name, age, relation, gender } = req.body;
    const parentId = req.user.id;

    // Generate dummy credentials for the family member
    const uniqueHash = Math.random().toString(36).substring(7);
    const dummyEmail = `family_${parentId}_${uniqueHash}@medilite.local`;
    const dummyPassword = await bcrypt.hash('FamilyMember123!', 10);

    // Create the User and PatientProfile
    const familyMember = await prisma.user.create({
      data: {
        name,
        email: dummyEmail,
        password: dummyPassword,
        role: 'PATIENT',
        isVerified: true,
        age: parseInt(age),
        gender,
        relationToParent: relation,
        parentId,
        patientProfile: {
          create: {}
        }
      },
      select: {
        id: true,
        name: true,
        age: true,
        gender: true,
        relationToParent: true,
        createdAt: true
      }
    });

    res.status(201).json({ message: 'Family member created', familyMember });
  } catch (error) {
    console.error('Error creating family member:', error);
    res.status(500).json({ error: 'Failed to create family member' });
  }
});

// Get all family members for the logged-in user
router.get('/', async (req, res) => {
  try {
    const parentId = req.user.id;

    const familyMembers = await prisma.user.findMany({
      where: { parentId },
      select: {
        id: true,
        name: true,
        age: true,
        gender: true,
        relationToParent: true,
        createdAt: true,
        patientProfile: true
      },
      orderBy: { createdAt: 'asc' }
    });

    res.status(200).json(familyMembers);
  } catch (error) {
    console.error('Error fetching family members:', error);
    res.status(500).json({ error: 'Failed to fetch family members' });
  }
});

export default router;
