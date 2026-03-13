import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Pill, Plus, Minus, Trash2, AlertTriangle, Save } from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Inventory = () => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMedicine, setNewMedicine] = useState({
    name: '',
    stock: '',
    minThreshold: '',
    unit: 'tablets'
  });

  useEffect(() => {
    if (user?.id) {
      fetchInventory();
    }
  }, [user]);

  const fetchInventory = async () => {
    try {
      const res = await api.get(`/inventory/${user.id}`);
      setInventory(res.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    try {
      await api.post('/inventory', {
        ...newMedicine,
        patientId: user.id
      });
      toast.success('Medicine added successfully!');
      setShowAddModal(false);
      setNewMedicine({ name: '', stock: '', minThreshold: '', unit: 'tablets' });
      fetchInventory();
    } catch (error) {
      console.error('Error adding medicine:', error);
      toast.error('Failed to add medicine');
    }
  };

  const handleUpdateStock = async (id, currentStock, delta) => {
    const newStock = Math.max(0, currentStock + delta);
    try {
      await api.put(`/inventory/${id}`, { stock: newStock });
      setInventory(inventory.map(item => 
        item.id === id ? { ...item, stock: newStock } : item
      ));
      toast.success('Stock updated');
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Failed to update stock');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this medicine?')) return;
    try {
      await api.delete(`/inventory/${id}`);
      setInventory(inventory.filter(item => item.id !== id));
      toast.success('Medicine removed');
    } catch (error) {
      console.error('Error deleting medicine:', error);
      toast.error('Failed to delete medicine');
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar role="patient" />
      <main className="flex-1 overflow-y-auto p-8">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Medicine Inventory</h1>
            <p className="text-slate-500 mt-1">Track your medicine stock and set low stock alerts.</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-5 py-3 bg-primary text-white rounded-xl font-semibold shadow-lg shadow-primary/25 hover:scale-[1.02] transition-transform active:scale-[0.98]"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Medicine
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <p className="text-slate-400 col-span-full">Loading inventory...</p>
          ) : inventory.length > 0 ? (
            inventory.map((item) => (
              <div 
                key={item.id} 
                className={`bg-white p-6 rounded-2xl border ${
                  item.stock <= item.minThreshold ? 'border-red-200 bg-red-50/30' : 'border-slate-200'
                } shadow-sm hover:shadow-md transition-all relative overflow-hidden`}
              >
                {item.stock <= item.minThreshold && (
                  <div className="absolute top-0 right-0 p-2 bg-red-100 text-red-600 rounded-bl-xl flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                    <AlertTriangle className="w-3 h-3" />
                    Low Stock
                  </div>
                )}
                
                <div className="flex items-start gap-4 mb-6">
                  <div className={`p-3 rounded-xl ${item.stock <= item.minThreshold ? 'bg-red-100' : 'bg-blue-50'}`}>
                    <Pill className={`w-6 h-6 ${item.stock <= item.minThreshold ? 'text-red-600' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{item.name}</h3>
                    <p className="text-sm text-slate-500 capitalize">{item.unit}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl mb-6">
                  <div>
                    <p className="text-xs font-medium text-slate-400 mb-1">Current Stock</p>
                    <p className={`text-2xl font-black ${item.stock <= item.minThreshold ? 'text-red-600' : 'text-slate-900'}`}>
                      {item.stock}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleUpdateStock(item.id, item.stock, -1)}
                      className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleUpdateStock(item.id, item.stock, 1)}
                      className="p-2 bg-primary text-white rounded-lg hover:bg-primary-dark shadow-sm shadow-primary/20"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Min. Threshold: <span className="font-bold">{item.minThreshold}</span></span>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
              <Pill className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">No medicines in your inventory yet.</p>
              <button 
                onClick={() => setShowAddModal(true)}
                className="mt-4 text-primary font-bold hover:underline"
              >
                Add your first medicine
              </button>
            </div>
          )}
        </div>
      </main>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 transform animate-in fade-in zoom-in duration-300">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Add New Medicine</h2>
            <form onSubmit={handleAddMedicine} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Medicine Name</label>
                <input 
                  type="text" 
                  required
                  value={newMedicine.name}
                  onChange={(e) => setNewMedicine({...newMedicine, name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder="e.g. Paracetamol"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Initial Stock</label>
                  <input 
                    type="number" 
                    required
                    value={newMedicine.stock}
                    onChange={(e) => setNewMedicine({...newMedicine, stock: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Min. Threshold</label>
                  <input 
                    type="number" 
                    required
                    value={newMedicine.minThreshold}
                    onChange={(e) => setNewMedicine({...newMedicine, minThreshold: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="5"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Unit</label>
                <select 
                  value={newMedicine.unit}
                  onChange={(e) => setNewMedicine({...newMedicine, unit: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                >
                  <option value="tablets">Tablets</option>
                  <option value="capsules">Capsules</option>
                  <option value="bottles">Bottles</option>
                  <option value="strips">Strips</option>
                </select>
              </div>
              <div className="flex gap-4 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)} 
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/25"
                >
                  Save Medicine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
