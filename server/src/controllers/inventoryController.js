import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

export const getInventory = async (req, res) => {
  try {
    const { patientId } = req.params; // This is the user.id from frontend
    
    // Find the patient profile first
    const profile = await prisma.patientProfile.findUnique({
      where: { userId: patientId }
    });

    if (!profile) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    const inventory = await prisma.medicineInventory.findMany({
      where: { patientId: profile.id },
      orderBy: { name: 'asc' }
    });
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addMedicine = async (req, res) => {
  try {
    const { patientId, name, stock, minThreshold, unit } = req.body; // patientId is user.id
    
    // Find the patient profile
    const profile = await prisma.patientProfile.findUnique({
      where: { userId: patientId }
    });

    if (!profile) {
      return res.status(404).json({ error: 'Patient profile not found. Please complete your profile first.' });
    }

    const medicine = await prisma.medicineInventory.create({
      data: {
        patientId: profile.id,
        name,
        stock: parseInt(stock),
        minThreshold: parseInt(minThreshold),
        unit
      }
    });
    res.status(201).json(medicine);
  } catch (error) {
    console.error('Add medicine error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;
    const medicine = await prisma.medicineInventory.update({
      where: { id },
      data: { stock: parseInt(stock) }
    });
    res.json(medicine);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.medicineInventory.delete({
      where: { id }
    });
    res.json({ message: 'Medicine deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
