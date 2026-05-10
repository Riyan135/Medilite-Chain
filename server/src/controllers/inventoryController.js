import PatientProfile from '../models/PatientProfile.js';
import MedicineInventory from '../models/MedicineInventory.js';
import User from '../models/User.js';

const normalizeInventory = (item) => ({
  ...item,
  id: item._id.toString(),
});

export const getInventory = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (patientId !== req.user.id && req.user.role === 'PATIENT') {
      const isFamilyMember = await User.exists({ _id: patientId, parentId: req.user.id });
      if (!isFamilyMember) {
        return res.status(403).json({ error: 'Unauthorized to view inventory for this patient' });
      }
    }

    const profile = await PatientProfile.findOne({ userId: patientId }).lean();

    if (!profile) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    const inventory = await MedicineInventory.find({ patientUserId: patientId }).sort({ name: 1 }).lean();
    res.json(inventory.map(normalizeInventory));
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const addMedicine = async (req, res) => {
  try {
    const { patientId, name, stock, minThreshold, unit } = req.body;

    if (patientId !== req.user.id && req.user.role === 'PATIENT') {
      const isFamilyMember = await User.exists({ _id: patientId, parentId: req.user.id });
      if (!isFamilyMember) {
        return res.status(403).json({ error: 'Unauthorized to add medicine for this patient' });
      }
    }

    const profile = await PatientProfile.findOne({ userId: patientId }).lean();

    if (!profile) {
      return res.status(404).json({ error: 'Patient profile not found. Please complete your profile first.' });
    }

    const medicine = await MedicineInventory.create({
      patientUserId: patientId,
      name,
      stock: parseInt(stock, 10) || 0,
      minThreshold: parseInt(minThreshold, 10) || 0,
      unit: unit || 'units',
    });

    res.status(201).json(normalizeInventory(medicine.toObject()));
  } catch (error) {
    console.error('Add medicine error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;

    const medicine = await MedicineInventory.findById(id);

    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    if (medicine.patientUserId !== req.user.id && req.user.role === 'PATIENT') {
      const isFamilyMember = await User.exists({ _id: medicine.patientUserId, parentId: req.user.id });
      if (!isFamilyMember) {
        return res.status(403).json({ error: 'Unauthorized to update this medicine' });
      }
    }

    medicine.stock = parseInt(stock, 10) || 0;
    await medicine.save();

    res.json(normalizeInventory(medicine.toObject()));
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const medicine = await MedicineInventory.findById(id);

    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    if (medicine.patientUserId !== req.user.id && req.user.role === 'PATIENT') {
      const isFamilyMember = await User.exists({ _id: medicine.patientUserId, parentId: req.user.id });
      if (!isFamilyMember) {
        return res.status(403).json({ error: 'Unauthorized to delete this medicine' });
      }
    }

    await MedicineInventory.findByIdAndDelete(id);

    res.json({ message: 'Medicine deleted successfully' });
  } catch (error) {
    console.error('Delete medicine error:', error);
    res.status(500).json({ error: error.message });
  }
};
