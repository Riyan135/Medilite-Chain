import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import PatientProfile from '../models/PatientProfile.js';

const router = express.Router();

const calculateAgeFromDob = (dateOfBirth) => {
  if (!dateOfBirth) {
    return null;
  }

  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }

  return Math.max(age, 0);
};

// Add a family member
router.post('/', async (req, res) => {
  try {
    const { name, dateOfBirth, relation, gender, bloodGroup } = req.body;
    const parentId = req.user.id;
    const calculatedAge = calculateAgeFromDob(dateOfBirth);

    if (!dateOfBirth || calculatedAge === null) {
      return res.status(400).json({ error: 'A valid date of birth is required' });
    }

    // Generate dummy credentials for the family member
    const uniqueHash = Math.random().toString(36).substring(7);
    const dummyEmail = `family_${parentId}_${uniqueHash}@medilite.local`;
    const dummyPassword = await bcrypt.hash('FamilyMember123!', 10);

    const createdUser = await User.create({
      name,
      email: dummyEmail,
      password: dummyPassword,
      role: 'PATIENT',
      isVerified: true,
      age: calculatedAge,
      dateOfBirth,
      gender: gender || null,
      relationToParent: relation || null,
      parentId,
    });

    await PatientProfile.create({
      userId: createdUser._id.toString(),
      bloodGroup: bloodGroup || null,
    });

    const familyMember = {
      id: createdUser._id.toString(),
      name: createdUser.name,
      age: createdUser.age,
      dateOfBirth: createdUser.dateOfBirth,
      gender: createdUser.gender,
      relationToParent: createdUser.relationToParent,
      createdAt: createdUser.createdAt,
      patientProfile: {
        bloodGroup: bloodGroup || null,
      },
    };

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

    const users = await User.find({ parentId }).sort({ createdAt: 1 }).lean();
    const profileEntries = await PatientProfile.find({
      userId: { $in: users.map((user) => user._id.toString()) },
    }).lean();
    const profileMap = new Map(profileEntries.map((profile) => [profile.userId, profile]));

    const familyMembers = users.map((member) => ({
      id: member._id.toString(),
      name: member.name,
      age: member.age,
      dateOfBirth: member.dateOfBirth,
      gender: member.gender,
      relationToParent: member.relationToParent,
      createdAt: member.createdAt,
      patientProfile: profileMap.get(member._id.toString()) || null,
    }));

    res.status(200).json(familyMembers);
  } catch (error) {
    console.error('Error fetching family members:', error);
    res.status(500).json({ error: 'Failed to fetch family members' });
  }
});

export default router;
