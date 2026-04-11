import Medicine from '../models/Medicine.js';
import StockTransaction from '../models/StockTransaction.js';

const normalizeMedicineName = (value = '') => value.trim().toLowerCase();

const quantityFromItem = (item) => {
  const parsed = Number.parseInt(item?.quantity, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

const aggregatePrescription = (prescription = []) => {
  const counts = new Map();

  prescription.forEach((item) => {
    const key = normalizeMedicineName(item?.medicine);
    if (!key) {
      return;
    }

    counts.set(key, (counts.get(key) || 0) + quantityFromItem(item));
  });

  return counts;
};

const findMedicineByName = async (nameKey) =>
  Medicine.findOne({
    name: new RegExp(`^${nameKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
  });

export const reconcilePrescriptionStock = async ({
  previousPrescription = [],
  nextPrescription = [],
  consultationId = null,
  actorUserId = null,
}) => {
  const previousMap = aggregatePrescription(previousPrescription);
  const nextMap = aggregatePrescription(nextPrescription);
  const medicineKeys = new Set([...previousMap.keys(), ...nextMap.keys()]);

  for (const medicineKey of medicineKeys) {
    const previousQty = previousMap.get(medicineKey) || 0;
    const nextQty = nextMap.get(medicineKey) || 0;
    const delta = nextQty - previousQty;

    if (delta === 0) {
      continue;
    }

    const medicine = await findMedicineByName(medicineKey);
    if (!medicine) {
      continue;
    }

    if (delta > 0) {
      const appliedDelta = Math.min(delta, medicine.quantity);
      if (appliedDelta <= 0) {
        continue;
      }

      medicine.quantity -= appliedDelta;
      await medicine.save();

      await StockTransaction.create({
        medicineId: medicine._id.toString(),
        medicineName: medicine.name,
        type: 'OUT',
        quantity: appliedDelta,
        source: 'PRESCRIPTION',
        note: `Auto-deducted from consultation ${consultationId || 'manual update'}`,
        consultationId,
        createdBy: actorUserId,
      });
    } else {
      const restockQty = Math.abs(delta);
      medicine.quantity += restockQty;
      await medicine.save();

      await StockTransaction.create({
        medicineId: medicine._id.toString(),
        medicineName: medicine.name,
        type: 'IN',
        quantity: restockQty,
        source: 'ADJUSTMENT',
        note: `Prescription updated for consultation ${consultationId || 'manual update'}`,
        consultationId,
        createdBy: actorUserId,
      });
    }
  }
};

export const serializeMedicine = (medicine) => {
  const value = medicine.toObject ? medicine.toObject() : medicine;
  const now = new Date();
  const expiryDate = new Date(value.expiryDate);
  const diffMs = expiryDate.getTime() - now.getTime();
  const daysUntilExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return {
    ...value,
    id: value._id.toString(),
    category: value.category,
    isLowStock: value.quantity < value.lowStockThreshold,
    isExpired: expiryDate < now,
    isNearExpiry: expiryDate >= now && daysUntilExpiry <= 30,
    daysUntilExpiry,
  };
};

export const serializeTransaction = (transaction) => {
  const value = transaction.toObject ? transaction.toObject() : transaction;
  return {
    ...value,
    id: value._id.toString(),
  };
};
