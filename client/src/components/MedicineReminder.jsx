import React, { useState, useEffect } from 'react';
import { Bell, Plus, Clock, Trash2, X, AlertCircle } from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const MedicineReminder = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [isListeningName, setIsListeningName] = useState(false);
  const [isListeningDosage, setIsListeningDosage] = useState(false);

  const handleVoiceCommand = (field) => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Voice recognition is not supported in your browser.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      if (field === 'medicineName') setIsListeningName(true);
      if (field === 'dosage') setIsListeningDosage(true);
      toast.success('Listening... Speak now', { icon: '🎙️' });
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (field === 'medicineName') {
        setFormData((prev) => ({ ...prev, medicineName: prev.medicineName ? `${prev.medicineName} ${transcript}` : transcript }));
      } else if (field === 'dosage') {
        setFormData((prev) => ({ ...prev, dosage: prev.dosage ? `${prev.dosage} ${transcript}` : transcript }));
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      if (field === 'medicineName') setIsListeningName(false);
      if (field === 'dosage') setIsListeningDosage(false);
      toast.error('Error recognizing voice. Please try again.');
    };

    recognition.onend = () => {
      if (field === 'medicineName') setIsListeningName(false);
      if (field === 'dosage') setIsListeningDosage(false);
    };

    recognition.start();
  };

  // Form State
  const [formData, setFormData] = useState({
    medicineName: '',
    dosage: '',
    frequency: 'Everyday',
    time: '',
    startDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (user?.id) {
      fetchReminders();
    }
  }, [user?.id]);

  const fetchReminders = async () => {
    try {
      const response = await api.get(`/reminders/${user.id}`);
      setReminders(response.data);
    } catch (error) {
      console.error('Error fetching reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReminder = async (e) => {
    e.preventDefault();
    try {
      await api.post('/reminders', {
        ...formData,
        clerkId: user.id
      });
      setShowAddForm(false);
      fetchReminders();
      setFormData({
        medicineName: '',
        dosage: '',
        frequency: 'Everyday',
        time: '',
        startDate: new Date().toISOString().split('T')[0]
      });
      toast.success('Reminder scheduled');
    } catch (error) {
      console.error('Error adding reminder:', error);
      toast.error('Failed to add reminder');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/reminders/${id}`);
      fetchReminders();
      toast.success('Reminder removed');
    } catch (error) {
      console.error('Error deleting reminder:', error);
      toast.error('Failed to delete reminder');
    }
  };

  const handleToggle = async (id, currentStatus) => {
    try {
      await api.patch(`/reminders/${id}/toggle`, { isActive: !currentStatus });
      fetchReminders();
      toast.success(currentStatus ? 'Reminder deactivated' : 'Reminder activated');
    } catch (error) {
      console.error('Error toggling reminder:', error);
      toast.error('Failed to update reminder');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <header className="flex justify-between items-center mb-10 text-center md:text-left flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Medicine Reminders</h1>
          <p className="text-slate-500 mt-1">Manage your medication schedule and alerts.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="flex items-center px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/25 hover:translate-y-[-2px] transition-all"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Reminder
        </button>
      </header>

      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 transform animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900">New Reminder</h2>
              <button onClick={() => setShowAddForm(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {!user?.primaryPhoneNumber && (
              <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-xl mb-6">
                <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
                <p className="text-xs text-orange-700 leading-relaxed">
                  You haven't added a phone number to your profile. You won't receive SMS alerts until you add one via your account settings.
                </p>
              </div>
            )}
            
            <form onSubmit={handleAddReminder} className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-semibold text-slate-700">Medicine Name</label>
                  <button
                    type="button"
                    onClick={() => handleVoiceCommand('medicineName')}
                    disabled={isListeningName}
                    className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${isListeningName ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                    title="Use voice to text"
                  >
                    {isListeningName ? <div className="w-4 h-4 rounded-full border-2 border-red-500 border-t-transparent animate-spin" /> : <span className="text-lg leading-none">🎙️</span>}
                  </button>
                </div>
                <input 
                  type="text" required
                  value={formData.medicineName}
                  onChange={(e) => setFormData({...formData, medicineName: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder="e.g. Paracetamol"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-semibold text-slate-700">Dosage</label>
                    <button
                      type="button"
                      onClick={() => handleVoiceCommand('dosage')}
                      disabled={isListeningDosage}
                      className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${isListeningDosage ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                      title="Use voice to text"
                    >
                      {isListeningDosage ? <div className="w-4 h-4 rounded-full border-2 border-red-500 border-t-transparent animate-spin" /> : <span className="text-lg leading-none">🎙️</span>}
                    </button>
                  </div>
                  <input 
                    type="text" required
                    value={formData.dosage}
                    onChange={(e) => setFormData({...formData, dosage: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="e.g. 500mg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Time</label>
                  <input 
                    type="time" required
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Frequency</label>
                <select 
                  value={formData.frequency}
                  onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                >
                  <option>Everyday</option>
                  <option>Mon, Wed, Fri</option>
                  <option>Tue, Thu, Sat</option>
                  <option>Weekends</option>
                </select>
              </div>
              <button type="submit" className="w-full py-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/25 hover:translate-y-[-2px] transition-all mt-4">
                Save Reminder
              </button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : reminders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reminders.map((reminder) => (
            <div key={reminder.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
              <div className={`absolute top-0 left-0 bottom-0 w-1 ${reminder.isActive ? 'bg-primary' : 'bg-slate-300'}`} />
              
              <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-xl ${reminder.isActive ? 'bg-primary/5' : 'bg-slate-100'}`}>
                  <Bell className={`w-6 h-6 ${reminder.isActive ? 'text-primary' : 'text-slate-400'}`} />
                </div>
                <button 
                  onClick={() => handleDelete(reminder.id)}
                  className="p-2 hover:bg-red-50 rounded-lg text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-1">{reminder.medicineName}</h3>
              <p className="text-slate-500 font-medium mb-6">{reminder.dosage} • {reminder.frequency}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center text-slate-700 bg-slate-50 px-3 py-2 rounded-lg font-bold">
                  <Clock className="w-4 h-4 mr-2 text-primary" />
                  {reminder.time}
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={reminder.isActive} 
                    onChange={() => handleToggle(reminder.id, reminder.isActive)}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-600">No reminders set yet</h3>
          <p className="text-slate-400">Click the button above to add your first medicine reminder.</p>
        </div>
      )}
    </div>
  );
};

export default MedicineReminder;
