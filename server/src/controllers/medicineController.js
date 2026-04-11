import Medicine from '../models/Medicine.js';
import StockTransaction from '../models/StockTransaction.js';
import { serializeMedicine, serializeTransaction } from '../services/medicineStock.js';

const ensureAdminOrDoctor = (req, res) => {
  if (!['ADMIN', 'DOCTOR'].includes(req.user?.role)) {
    res.status(403).json({ error: 'Only admin or doctor accounts can manage medicines' });
    return false;
  }

  return true;
};

const toCategory = (value = 'TABLET') => value.trim().toUpperCase();

export const addMedicineStock = async (req, res) => {
  if (!ensureAdminOrDoctor(req, res)) return;

  try {
    const {
      name,
      category,
      quantity,
      price,
      expiryDate,
      supplier,
      lowStockThreshold,
    } = req.body;

    if (!name?.trim() || !supplier?.trim() || !expiryDate) {
      return res.status(400).json({ error: 'Name, supplier, and expiry date are required' });
    }

    const medicine = await Medicine.create({
      name: name.trim(),
      category: toCategory(category),
      quantity: Number.parseInt(quantity, 10) || 0,
      price: Number.parseFloat(price) || 0,
      expiryDate,
      supplier: supplier.trim(),
      lowStockThreshold: Number.parseInt(lowStockThreshold, 10) || 10,
    });

    if (medicine.quantity > 0) {
      await StockTransaction.create({
        medicineId: medicine._id.toString(),
        medicineName: medicine.name,
        type: 'IN',
        quantity: medicine.quantity,
        source: 'MANUAL',
        note: 'Initial stock added',
        createdBy: req.user.id,
      });
    }

    res.status(201).json(serializeMedicine(medicine));
  } catch (error) {
    console.error('Add medicine stock error:', error);
    res.status(500).json({ error: 'Failed to add medicine' });
  }
};

export const getMedicines = async (req, res) => {
  if (!ensureAdminOrDoctor(req, res)) return;

  try {
    const { search = '', category = 'ALL', expiry = 'ALL', stock = 'ALL' } = req.query;
    const medicines = await Medicine.find().sort({ createdAt: -1 }).lean();

    const normalizedSearch = search.trim().toLowerCase();
    const filtered = medicines
      .map(serializeMedicine)
      .filter((medicine) => {
        const matchesSearch =
          !normalizedSearch ||
          medicine.name.toLowerCase().includes(normalizedSearch) ||
          medicine.supplier.toLowerCase().includes(normalizedSearch);

        const matchesCategory = category === 'ALL' || medicine.category === toCategory(category);
        const matchesExpiry =
          expiry === 'ALL' ||
          (expiry === 'EXPIRED' && medicine.isExpired) ||
          (expiry === 'NEAR_EXPIRY' && medicine.isNearExpiry) ||
          (expiry === 'SAFE' && !medicine.isExpired && !medicine.isNearExpiry);
        const matchesStock =
          stock === 'ALL' ||
          (stock === 'LOW' && medicine.isLowStock) ||
          (stock === 'AVAILABLE' && !medicine.isLowStock && medicine.quantity > 0) ||
          (stock === 'OUT' && medicine.quantity === 0);

        return matchesSearch && matchesCategory && matchesExpiry && matchesStock;
      });

    res.json(filtered);
  } catch (error) {
    console.error('Get medicines error:', error);
    res.status(500).json({ error: 'Failed to fetch medicines' });
  }
};

export const updateMedicine = async (req, res) => {
  if (!ensureAdminOrDoctor(req, res)) return;

  try {
    const current = await Medicine.findById(req.params.id);
    if (!current) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    const previousQuantity = current.quantity;
    current.name = req.body.name?.trim() || current.name;
    current.category = req.body.category ? toCategory(req.body.category) : current.category;
    current.quantity = Number.isFinite(Number(req.body.quantity)) ? Math.max(0, Number(req.body.quantity)) : current.quantity;
    current.price = Number.isFinite(Number(req.body.price)) ? Math.max(0, Number(req.body.price)) : current.price;
    current.expiryDate = req.body.expiryDate || current.expiryDate;
    current.supplier = req.body.supplier?.trim() || current.supplier;
    current.lowStockThreshold = Number.isFinite(Number(req.body.lowStockThreshold))
      ? Math.max(0, Number(req.body.lowStockThreshold))
      : current.lowStockThreshold;

    await current.save();

    const quantityDelta = current.quantity - previousQuantity;
    if (quantityDelta !== 0) {
      await StockTransaction.create({
        medicineId: current._id.toString(),
        medicineName: current.name,
        type: quantityDelta > 0 ? 'IN' : 'OUT',
        quantity: Math.abs(quantityDelta),
        source: 'ADJUSTMENT',
        note: 'Stock adjusted from medicine edit',
        createdBy: req.user.id,
      });
    }

    res.json(serializeMedicine(current));
  } catch (error) {
    console.error('Update medicine error:', error);
    res.status(500).json({ error: 'Failed to update medicine' });
  }
};

export const deleteMedicineStock = async (req, res) => {
  if (!ensureAdminOrDoctor(req, res)) return;

  try {
    const medicine = await Medicine.findByIdAndDelete(req.params.id);
    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    if (medicine.quantity > 0) {
      await StockTransaction.create({
        medicineId: medicine._id.toString(),
        medicineName: medicine.name,
        type: 'OUT',
        quantity: medicine.quantity,
        source: 'DELETE',
        note: 'Medicine removed from stock',
        createdBy: req.user.id,
      });
    }

    res.json({ message: 'Medicine deleted successfully' });
  } catch (error) {
    console.error('Delete medicine error:', error);
    res.status(500).json({ error: 'Failed to delete medicine' });
  }
};

export const createStockTransaction = async (req, res) => {
  if (!ensureAdminOrDoctor(req, res)) return;

  try {
    const { medicineId, type, quantity, note } = req.body;
    const medicine = await Medicine.findById(medicineId);

    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    const parsedQuantity = Number.parseInt(quantity, 10);
    if (!parsedQuantity || parsedQuantity < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1' });
    }

    if (type === 'OUT' && medicine.quantity < parsedQuantity) {
      return res.status(400).json({ error: 'Not enough stock available' });
    }

    medicine.quantity = type === 'OUT' ? medicine.quantity - parsedQuantity : medicine.quantity + parsedQuantity;
    await medicine.save();

    const transaction = await StockTransaction.create({
      medicineId: medicine._id.toString(),
      medicineName: medicine.name,
      type,
      quantity: parsedQuantity,
      source: 'MANUAL',
      note: note?.trim() || null,
      createdBy: req.user.id,
    });

    res.status(201).json({
      transaction: serializeTransaction(transaction),
      medicine: serializeMedicine(medicine),
    });
  } catch (error) {
    console.error('Create stock transaction error:', error);
    res.status(500).json({ error: 'Failed to update stock' });
  }
};

export const getStockTransactions = async (req, res) => {
  if (!ensureAdminOrDoctor(req, res)) return;

  try {
    const transactions = await StockTransaction.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json(transactions.map(serializeTransaction));
  } catch (error) {
    console.error('Get stock transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch stock transactions' });
  }
};

export const getMedicineStats = async (req, res) => {
  if (!ensureAdminOrDoctor(req, res)) return;

  try {
    const medicines = await Medicine.find().lean();
    const serialized = medicines.map(serializeMedicine);

    res.json({
      totalMedicines: serialized.length,
      lowStockCount: serialized.filter((item) => item.isLowStock).length,
      expiredCount: serialized.filter((item) => item.isExpired).length,
      nearExpiryCount: serialized.filter((item) => item.isNearExpiry).length,
      totalUnits: serialized.reduce((sum, item) => sum + item.quantity, 0),
      byCategory: ['TABLET', 'SYRUP', 'INJECTION'].map((category) => ({
        category,
        count: serialized.filter((item) => item.category === category).length,
      })),
    });
  } catch (error) {
    console.error('Get medicine stats error:', error);
    res.status(500).json({ error: 'Failed to fetch medicine stats' });
  }
};
