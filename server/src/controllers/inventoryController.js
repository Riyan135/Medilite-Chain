import PatientProfile from '../models/PatientProfile.js';
import MedicineInventory from '../models/MedicineInventory.js';

const normalizeInventory = (item) => ({
  ...item,
  id: item._id.toString(),
});

export const getInventory = async (req, res) => {
  try {
    const { patientId } = req.params;
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

    const medicine = await MedicineInventory.findByIdAndUpdate(
      id,
      { $set: { stock: parseInt(stock, 10) || 0 } },
      { new: true }
    ).lean();

    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    res.json(normalizeInventory(medicine));
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await MedicineInventory.findByIdAndDelete(id).lean();

    if (!deleted) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    res.json({ message: 'Medicine deleted successfully' });
  } catch (error) {
    console.error('Delete medicine error:', error);
    res.status(500).json({ error: error.message });
  }
};
