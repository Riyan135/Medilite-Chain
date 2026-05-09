import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  Edit3,
  Package2,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';

import AdminTopbar from '../components/AdminTopbar';
import Sidebar from '../components/Sidebar';
import api from '../api/api';

const emptyMedicine = {
  name: '',
  category: 'TABLET',
  quantity: 0,
  price: 0,
  expiryDate: '',
  supplier: '',
  lowStockThreshold: 10,
};

const emptyStockAction = {
  medicineId: '',
  type: 'IN',
  quantity: 1,
  note: '',
};

const StatCard = ({ title, value, subtitle, tone = 'blue', icon: Icon }) => {
  const tones = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  };

  return (
    <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${tones[tone]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <p className="mt-5 text-sm font-semibold text-slate-500">{title}</p>
      <h2 className="mt-2 text-4xl font-extrabold text-slate-900">{value}</h2>
      <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-400">{subtitle}</p>
    </div>
  );
};

const Medicines = () => {
  const [medicines, setMedicines] = useState([]);
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: 'ALL',
    expiry: 'ALL',
    stock: 'ALL',
  });
  const [showMedicineModal, setShowMedicineModal] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [medicineForm, setMedicineForm] = useState(emptyMedicine);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockForm, setStockForm] = useState(emptyStockAction);
  const [saving, setSaving] = useState(false);

  const fetchMedicines = async () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    const response = await api.get(`/medicines?${params.toString()}`);
    setMedicines(response.data);
  };

  const fetchSupportingData = async () => {
    const [statsRes, transactionRes] = await Promise.all([
      api.get('/medicines/stats'),
      api.get('/stock'),
    ]);
    setStats(statsRes.data);
    setTransactions(transactionRes.data);
  };

  const fetchData = async () => {
    try {
      await Promise.all([fetchMedicines(), fetchSupportingData()]);
    } catch (error) {
      console.error('Error fetching medicines:', error);
      toast.error('Failed to load medicine stock');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchMedicines().catch((error) => {
      console.error('Error filtering medicines:', error);
      toast.error('Failed to refresh medicine list');
    });
  }, [filters.search, filters.category, filters.expiry, filters.stock]);

  const resetMedicineModal = () => {
    setShowMedicineModal(false);
    setEditingMedicine(null);
    setMedicineForm(emptyMedicine);
  };

  const openCreateModal = () => {
    setEditingMedicine(null);
    setMedicineForm(emptyMedicine);
    setShowMedicineModal(true);
  };

  const openEditModal = (medicine) => {
    setEditingMedicine(medicine);
    setMedicineForm({
      name: medicine.name,
      category: medicine.category,
      quantity: medicine.quantity,
      price: medicine.price,
      expiryDate: medicine.expiryDate?.slice(0, 10) || '',
      supplier: medicine.supplier,
      lowStockThreshold: medicine.lowStockThreshold || 10,
    });
    setShowMedicineModal(true);
  };

  const openStockModal = (medicine) => {
    setStockForm({
      medicineId: medicine.id,
      type: 'IN',
      quantity: 1,
      note: '',
    });
    setShowStockModal(true);
  };

  const handleSaveMedicine = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editingMedicine) {
        await api.put(`/medicines/${editingMedicine.id}`, medicineForm);
        toast.success('Medicine updated');
      } else {
        await api.post('/medicines', medicineForm);
        toast.success('Medicine added');
      }

      resetMedicineModal();
      await fetchData();
    } catch (error) {
      console.error('Error saving medicine:', error);
      toast.error(error.response?.data?.error || 'Failed to save medicine');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMedicine = async (medicineId) => {
    try {
      await api.delete(`/medicines/${medicineId}`);
      toast.success('Medicine deleted');
      await fetchData();
    } catch (error) {
      console.error('Error deleting medicine:', error);
      toast.error(error.response?.data?.error || 'Failed to delete medicine');
    }
  };

  const handleStockSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post('/stock', stockForm);
      toast.success('Stock updated');
      setShowStockModal(false);
      setStockForm(emptyStockAction);
      await fetchData();
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error(error.response?.data?.error || 'Failed to update stock');
    } finally {
      setSaving(false);
    }
  };

  const chartData = useMemo(() => stats?.byCategory || [], [stats?.byCategory]);
  const inventorySummary = useMemo(() => {
    const total = stats?.totalMedicines || 0;
    const expiredCount = stats?.expiredCount || 0;
    const expiringCount = stats?.nearExpiryCount || 0;
    const safeCount = Math.max(total - expiredCount - expiringCount, 0);
    const percent = (value) => (total > 0 ? Math.round((value / total) * 100) : 0);

    return {
      total,
      expiredCount,
      expiringCount,
      safeCount,
      expiredPercent: percent(expiredCount),
      expiringPercent: percent(expiringCount),
      safePercent: percent(safeCount),
    };
  }, [stats?.expiredCount, stats?.nearExpiryCount, stats?.totalMedicines]);
  const stockGraphData = useMemo(
    () =>
      [...medicines]
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 6)
        .map((medicine) => ({
          id: medicine.id,
          name: medicine.name,
          quantity: medicine.quantity,
          tone: medicine.isExpired ? 'rose' : medicine.isLowStock ? 'amber' : 'emerald',
        })),
    [medicines]
  );
  const maxGraphQuantity = useMemo(
    () => Math.max(...stockGraphData.map((item) => item.quantity), 1),
    [stockGraphData]
  );

  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 pb-8 pt-20 md:px-8 md:pt-8">
        <div className="mb-10">
          <AdminTopbar
            title="Medicine Stock"
            subtitle="Manage medicine inventory, stock alerts, expiry risk, and prescription-linked deductions."
            notificationMode="inventory"
            inventorySummary={inventorySummary}
            showNotifications={false}
          />
          <div className="flex justify-end">
            <button
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-4 text-white font-black shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Add Medicine
            </button>
          </div>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Medicines" value={stats?.totalMedicines || 0} subtitle="Active inventory items" icon={Package2} tone="blue" />
          <StatCard title="Low Stock" value={stats?.lowStockCount || 0} subtitle="Needs restock soon" icon={AlertTriangle} tone="amber" />
          <StatCard title="Expired" value={stats?.expiredCount || 0} subtitle="Remove from active usage" icon={CalendarClock} tone="rose" />
          <StatCard title="Near Expiry" value={stats?.nearExpiryCount || 0} subtitle="Within the next 30 days" icon={CalendarClock} tone="emerald" />
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[1.7fr_1fr] gap-8">
          <div className="space-y-8">
            <div className="rounded-[2rem] border border-slate-100 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 px-6 py-5">
                <h2 className="text-2xl font-black text-slate-900">Stock Graph</h2>
                <p className="text-sm text-slate-500 mt-1">Top medicine quantities from the current filtered stock list.</p>
              </div>
              <div className="p-6">
                {stockGraphData.length === 0 ? (
                  <div className="text-slate-400">No medicines available to plot yet.</div>
                ) : (
                  <div className="space-y-5">
                    {stockGraphData.map((item) => (
                      <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_4rem] items-center gap-4">
                        <div>
                          <div className="flex items-center justify-between gap-3">
                            <p className="truncate font-bold text-slate-900">{item.name}</p>
                            <StatusBadge
                              label={item.tone === 'rose' ? 'Expired' : item.tone === 'amber' ? 'Low' : 'Available'}
                              tone={item.tone === 'rose' ? 'rose' : item.tone === 'amber' ? 'amber' : 'emerald'}
                            />
                          </div>
                          <div className="mt-3 h-4 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full ${
                                item.tone === 'rose'
                                  ? 'bg-gradient-to-r from-rose-400 to-rose-600'
                                  : item.tone === 'amber'
                                    ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                                    : 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                              }`}
                              style={{ width: `${(item.quantity / maxGraphQuantity) * 100}%` }}
                            />
                          </div>
                        </div>
                        <p className="text-right text-lg font-black text-slate-900">{item.quantity}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-100 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 px-6 py-5 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Inventory Table</h2>
                  <p className="text-sm text-slate-500 mt-1">Search by medicine, filter by category, expiry, and stock status.</p>
                </div>
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      value={filters.search}
                      onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                      placeholder="Search medicine or supplier"
                      className="rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 w-full md:w-64"
                    />
                  </div>
                  <select
                    value={filters.category}
                    onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="TABLET">Tablet</option>
                    <option value="SYRUP">Syrup</option>
                    <option value="INJECTION">Injection</option>
                  </select>
                  <select
                    value={filters.expiry}
                    onChange={(event) => setFilters((current) => ({ ...current, expiry: event.target.value }))}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <option value="ALL">All Expiry States</option>
                    <option value="EXPIRED">Expired</option>
                    <option value="NEAR_EXPIRY">Near Expiry</option>
                    <option value="SAFE">Safe</option>
                  </select>
                  <select
                    value={filters.stock}
                    onChange={(event) => setFilters((current) => ({ ...current, stock: event.target.value }))}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <option value="ALL">All Stock</option>
                    <option value="AVAILABLE">Available</option>
                    <option value="LOW">Low Stock</option>
                    <option value="OUT">Out of Stock</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="p-10 text-slate-400">Loading medicine stock...</div>
              ) : medicines.length === 0 ? (
                <div className="p-10 text-slate-400">No medicines found for the current filters.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/80">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Medicine</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Category</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Stock</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Price</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Expiry</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Supplier</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Status</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {medicines.map((medicine) => (
                        <tr key={medicine.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-900">{medicine.name}</p>
                            <p className="text-xs font-semibold text-slate-400 mt-1">Threshold {medicine.lowStockThreshold}</p>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-slate-600">{medicine.category}</td>
                          <td className="px-6 py-4">
                            <span className="font-black text-slate-900">{medicine.quantity}</span>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-slate-600">Rs. {medicine.price}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                            {new Date(medicine.expiryDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-slate-600">{medicine.supplier}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-2">
                              {medicine.isExpired && <StatusBadge label="Expired" tone="rose" />}
                              {!medicine.isExpired && medicine.isNearExpiry && <StatusBadge label="Near Expiry" tone="amber" />}
                              {medicine.isLowStock && <StatusBadge label="Low Stock" tone="rose" />}
                              {!medicine.isLowStock && !medicine.isExpired && !medicine.isNearExpiry && <StatusBadge label="Available" tone="emerald" />}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => openStockModal(medicine)}
                                className="rounded-xl bg-blue-50 px-3 py-2 text-sm font-bold text-blue-600"
                              >
                                Stock
                              </button>
                              <button
                                onClick={() => openEditModal(medicine)}
                                className="rounded-xl bg-slate-100 p-2 text-slate-600"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteMedicine(medicine.id)}
                                className="rounded-xl bg-rose-50 p-2 text-rose-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-8">
            <div className="rounded-[2rem] border border-slate-100 bg-white shadow-sm p-6">
              <h3 className="text-xl font-black text-slate-900">Category Snapshot</h3>
              <div className="mt-6 space-y-4">
                {chartData.map((item) => (
                  <div key={item.category}>
                    <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
                      <span>{item.category}</span>
                      <span>{item.count}</span>
                    </div>
                    <div className="mt-2 h-3 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                        style={{ width: `${stats?.totalMedicines ? (item.count / stats.totalMedicines) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-100 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 px-6 py-5">
                <h3 className="text-xl font-black text-slate-900">Recent Stock Activity</h3>
                <p className="text-sm text-slate-500 mt-1">Latest IN and OUT transactions.</p>
              </div>
              <div className="max-h-[30rem] overflow-y-auto divide-y divide-slate-100">
                {transactions.length === 0 ? (
                  <div className="p-6 text-slate-400">No stock transactions yet.</div>
                ) : (
                  transactions.map((transaction) => (
                    <div key={transaction.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-slate-900">{transaction.medicineName}</p>
                        <StatusBadge label={transaction.type} tone={transaction.type === 'IN' ? 'emerald' : 'blue'} />
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        Qty {transaction.quantity} | {transaction.source}
                      </p>
                      <p className="text-xs text-slate-400 mt-2">
                        {new Date(transaction.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        </section>
      </main>

      {showMedicineModal && (
        <ModalShell title={editingMedicine ? 'Edit Medicine' : 'Add Medicine'} onClose={resetMedicineModal}>
          <form onSubmit={handleSaveMedicine} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Medicine Name">
                <input
                  required
                  value={medicineForm.name}
                  onChange={(event) => setMedicineForm((current) => ({ ...current, name: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                />
              </FormField>
              <FormField label="Category">
                <select
                  value={medicineForm.category}
                  onChange={(event) => setMedicineForm((current) => ({ ...current, category: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                >
                  <option value="TABLET">Tablet</option>
                  <option value="SYRUP">Syrup</option>
                  <option value="INJECTION">Injection</option>
                </select>
              </FormField>
              <FormField label="Quantity">
                <input
                  type="number"
                  min="0"
                  required
                  value={medicineForm.quantity}
                  onChange={(event) => setMedicineForm((current) => ({ ...current, quantity: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                />
              </FormField>
              <FormField label="Price">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={medicineForm.price}
                  onChange={(event) => setMedicineForm((current) => ({ ...current, price: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                />
              </FormField>
              <FormField label="Expiry Date">
                <input
                  type="date"
                  required
                  value={medicineForm.expiryDate}
                  onChange={(event) => setMedicineForm((current) => ({ ...current, expiryDate: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                />
              </FormField>
              <FormField label="Supplier">
                <input
                  required
                  value={medicineForm.supplier}
                  onChange={(event) => setMedicineForm((current) => ({ ...current, supplier: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                />
              </FormField>
            </div>
            <FormField label="Low Stock Threshold">
              <input
                type="number"
                min="0"
                value={medicineForm.lowStockThreshold}
                onChange={(event) => setMedicineForm((current) => ({ ...current, lowStockThreshold: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              />
            </FormField>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={resetMedicineModal} className="rounded-2xl bg-slate-100 px-5 py-3 font-bold text-slate-700">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="rounded-2xl bg-slate-900 px-5 py-3 font-black text-white">
                {saving ? 'Saving...' : editingMedicine ? 'Update Medicine' : 'Add Medicine'}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {showStockModal && (
        <ModalShell title="Update Stock" onClose={() => setShowStockModal(false)}>
          <form onSubmit={handleStockSubmit} className="space-y-4">
            <FormField label="Transaction Type">
              <select
                value={stockForm.type}
                onChange={(event) => setStockForm((current) => ({ ...current, type: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              >
                <option value="IN">Increase Stock</option>
                <option value="OUT">Decrease Stock</option>
              </select>
            </FormField>
            <FormField label="Quantity">
              <input
                type="number"
                min="1"
                value={stockForm.quantity}
                onChange={(event) => setStockForm((current) => ({ ...current, quantity: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              />
            </FormField>
            <FormField label="Note">
              <textarea
                rows="4"
                value={stockForm.note}
                onChange={(event) => setStockForm((current) => ({ ...current, note: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                placeholder="Optional stock note"
              />
            </FormField>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowStockModal(false)} className="rounded-2xl bg-slate-100 px-5 py-3 font-bold text-slate-700">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="rounded-2xl bg-blue-600 px-5 py-3 font-black text-white">
                {saving ? 'Updating...' : 'Apply Stock Change'}
              </button>
            </div>
          </form>
        </ModalShell>
      )}
    </div>
  );
};

const StatusBadge = ({ label, tone }) => {
  const styles = {
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    rose: 'bg-rose-100 text-rose-700',
    blue: 'bg-blue-100 text-blue-700',
  };

  return <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${styles[tone]}`}>{label}</span>;
};

const ModalShell = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
    <div className="w-full max-w-3xl rounded-[2rem] bg-white p-8 shadow-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-900">{title}</h2>
        <button onClick={onClose} className="rounded-xl bg-slate-100 px-4 py-2 font-bold text-slate-700">
          Close
        </button>
      </div>
      {children}
    </div>
  </div>
);

const FormField = ({ label, children }) => (
  <label className="space-y-2 block">
    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</span>
    {children}
  </label>
);

export default Medicines;
