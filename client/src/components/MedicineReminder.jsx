import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Bell, Plus, Clock, Trash2, X, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import api from '../api/api';
import { useAuth } from '../context/AuthContext';

const MedicineReminder = () => {
  const { user } = useAuth();
  const { memberId } = useParams();
  const patientId = memberId || user?.id;
  
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isListeningName, setIsListeningName] = useState(false);
  const [isListeningDosage, setIsListeningDosage] = useState(false);
  const [formData, setFormData] = useState({
    medicineName: '',
    dosage: '',
    frequency: 'Everyday',
    time: '',
    startDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (patientId) {
      fetchReminders();
    }
  }, [patientId]);

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
        setFormData((prev) => ({
          ...prev,
          medicineName: prev.medicineName ? `${prev.medicineName} ${transcript}` : transcript,
        }));
      } else if (field === 'dosage') {
        setFormData((prev) => ({
          ...prev,
          dosage: prev.dosage ? `${prev.dosage} ${transcript}` : transcript,
        }));
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

  const fetchReminders = async () => {
    try {
      const response = await api.get(`/reminders/${patientId}`);
      setReminders(response.data);
    } catch (error) {
      console.error('Error fetching reminders:', error);
      if (error.response?.status === 403 && memberId) {
        window.location.href = '/reminders';
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddReminder = async (e) => {
    e.preventDefault();
    try {
      await api.post('/reminders', {
        ...formData,
        patientId,
      });
      setShowAddForm(false);
      fetchReminders();
      setFormData({
        medicineName: '',
        dosage: '',
        frequency: 'Everyday',
        time: '',
        startDate: new Date().toISOString().split('T')[0],
      });
      toast.success(user?.email ? 'Reminder scheduled and email enabled' : 'Reminder scheduled');
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

  const activeCount = reminders.filter((reminder) => reminder.isActive).length;
  const pausedCount = reminders.length - activeCount;

  return (
    <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-white/60 bg-[linear-gradient(145deg,rgba(239,246,255,0.94),rgba(255,255,255,0.92),rgba(224,242,254,0.9))] p-8 shadow-2xl shadow-sky-100/60 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-12 top-6 h-44 w-44 rounded-full bg-sky-300/20 blur-3xl animate-pulse" />
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-blue-400/15 blur-3xl animate-pulse" style={{ animationDelay: '0.8s' }} />
        <div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl animate-pulse" style={{ animationDelay: '1.6s' }} />
      </div>

      <div className="relative z-10">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4 text-center md:text-left">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.35em] text-sky-600">Daily Care</p>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">Medicine Reminders</h1>
            <p className="mt-2 text-slate-500">Manage your medication schedule, email alerts, and active doses in one place.</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 px-6 py-3 font-bold text-white shadow-xl shadow-sky-500/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-sky-500/30"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add Reminder
          </button>
        </header>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.75rem] border border-white/60 bg-white/70 p-5 shadow-lg shadow-slate-200/40 backdrop-blur transition-all duration-500 hover:-translate-y-1 hover:shadow-xl">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-sky-600">Total</p>
            <p className="mt-3 text-4xl font-black text-slate-900">{reminders.length}</p>
            <p className="mt-2 text-sm text-slate-500">All scheduled medicines in your routine.</p>
          </div>
          <div className="rounded-[1.75rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-lg shadow-emerald-100/40 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-emerald-600">Active</p>
            <p className="mt-3 text-4xl font-black text-slate-900">{activeCount}</p>
            <p className="mt-2 text-sm text-slate-500">Reminders currently sending alerts and due notifications.</p>
          </div>
          <div className="rounded-[1.75rem] border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-5 shadow-lg shadow-amber-100/40 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-600">Paused</p>
            <p className="mt-3 text-4xl font-black text-slate-900">{pausedCount}</p>
            <p className="mt-2 text-sm text-slate-500">Keep frequently skipped reminders muted until you need them again.</p>
          </div>
        </div>

        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-md">
            <div className="w-full max-w-md rounded-[2rem] border border-white/60 bg-white/90 p-8 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in duration-300">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-black tracking-tight text-slate-900">New Reminder</h2>
                <button onClick={() => setShowAddForm(false)} className="rounded-xl p-2 transition-colors hover:bg-slate-100">
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              {!user?.email && (
                <div className="mb-6 flex items-start gap-3 rounded-2xl border border-orange-100 bg-orange-50 p-4">
                  <AlertCircle className="mt-0.5 h-5 w-5 text-orange-500" />
                  <p className="text-xs leading-relaxed text-orange-700">
                    You have not added an email to your profile. You will not receive reminder emails until your account has a valid email address.
                  </p>
                </div>
              )}

              <form onSubmit={handleAddReminder} className="space-y-4">
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="block text-sm font-semibold text-slate-700">Medicine Name</label>
                    <button
                      type="button"
                      onClick={() => handleVoiceCommand('medicineName')}
                      disabled={isListeningName}
                      className={`flex items-center gap-1 rounded-lg p-1.5 transition-colors ${
                        isListeningName ? 'animate-pulse bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                      title="Use voice to text"
                    >
                      {isListeningName ? <div className="h-4 w-4 rounded-full border-2 border-red-500 border-t-transparent animate-spin" /> : <span className="text-lg leading-none">🎙️</span>}
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.medicineName}
                    onChange={(e) => setFormData({ ...formData, medicineName: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 outline-none transition-all duration-300 focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10"
                    placeholder="e.g. Paracetamol"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label className="block text-sm font-semibold text-slate-700">Dosage</label>
                      <button
                        type="button"
                        onClick={() => handleVoiceCommand('dosage')}
                        disabled={isListeningDosage}
                        className={`flex items-center gap-1 rounded-lg p-1.5 transition-colors ${
                          isListeningDosage ? 'animate-pulse bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                        title="Use voice to text"
                      >
                        {isListeningDosage ? <div className="h-4 w-4 rounded-full border-2 border-red-500 border-t-transparent animate-spin" /> : <span className="text-lg leading-none">🎙️</span>}
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={formData.dosage}
                      onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 outline-none transition-all duration-300 focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10"
                      placeholder="e.g. 500mg"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">Time</label>
                    <input
                      type="time"
                      required
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 outline-none transition-all duration-300 focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Frequency</label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 outline-none transition-all duration-300 focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10"
                  >
                    <option>Everyday</option>
                    <option>Mon, Wed, Fri</option>
                    <option>Tue, Thu, Sat</option>
                    <option>Weekends</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="mt-4 w-full rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 py-4 font-bold text-white shadow-xl shadow-sky-500/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-sky-500/30"
                >
                  Save Reminder
                </button>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          </div>
        ) : reminders.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className="group relative overflow-hidden rounded-[1.75rem] border border-white/60 bg-white/75 p-6 shadow-lg shadow-slate-200/40 backdrop-blur transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-sky-100/50"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-sky-100/50 via-blue-100/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className={`absolute bottom-0 left-0 top-0 w-1 ${reminder.isActive ? 'bg-primary' : 'bg-slate-300'}`} />

                <div className="mb-6 flex items-start justify-between">
                  <div className={`rounded-2xl p-3 transition-transform duration-500 group-hover:scale-105 ${reminder.isActive ? 'bg-primary/5' : 'bg-slate-100'}`}>
                    <Bell className={`h-6 w-6 ${reminder.isActive ? 'text-primary' : 'text-slate-400'}`} />
                  </div>
                  <button
                    onClick={() => handleDelete(reminder.id)}
                    className="relative z-10 rounded-xl p-2 text-red-500 transition-all duration-300 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <h3 className="mb-1 text-xl font-black tracking-tight text-slate-900">{reminder.medicineName}</h3>
                <p className="mb-6 font-medium text-slate-500">{reminder.dosage} • {reminder.frequency}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center rounded-xl bg-slate-50 px-3 py-2 font-bold text-slate-700 shadow-sm">
                    <Clock className="mr-2 h-4 w-4 text-primary" />
                    {reminder.time}
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={reminder.isActive}
                      onChange={() => handleToggle(reminder.id, reminder.isActive)}
                      className="peer sr-only"
                    />
                    <div className="h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white" />
                  </label>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-sky-200 bg-white/70 py-20 text-center shadow-lg shadow-slate-200/20 backdrop-blur">
            <Bell className="mx-auto mb-4 h-12 w-12 animate-pulse text-sky-300" />
            <h3 className="text-lg font-bold text-slate-600">No reminders set yet</h3>
            <p className="text-slate-400">Click the button above to add your first medicine reminder.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicineReminder;
