import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, ArrowRight, Calendar, Heart, X, Loader2, Droplets } from 'lucide-react';
import toast from 'react-hot-toast';

import api from '../api/api';
import { useAuth } from '../context/AuthContext';

const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const calculateAgeFromDob = (dateOfBirth) => {
  if (!dateOfBirth) {
    return '';
  }

  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) {
    return '';
  }

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }

  return age >= 0 ? age : '';
};

const FamilyProfiles = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    relation: '',
    gender: 'Male',
    bloodGroup: '',
  });

  const detectedAge = calculateAgeFromDob(formData.dateOfBirth);

  useEffect(() => {
    if (user?.id) {
      fetchMembers();
    }
  }, [user]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/family');
      setMembers(res.data);
    } catch (error) {
      console.error('Failed to fetch family members', error);
      toast.error('Failed to load family profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      await api.post('/family', formData);
      toast.success('Family member added successfully!');
      setIsModalOpen(false);
      setFormData({
        name: '',
        dateOfBirth: '',
        relation: '',
        gender: 'Male',
        bloodGroup: '',
      });
      fetchMembers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add family member');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent relative overflow-hidden selection:bg-blue-600/20 selection:text-blue-900">
      <div className="absolute top-0 right-0 h-[600px] w-[600px] translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-bl from-blue-400/20 to-indigo-400/20 blur-[120px] animate-float pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 h-[600px] w-[600px] -translate-x-1/2 translate-y-1/2 rounded-full bg-gradient-to-tr from-purple-400/20 to-blue-400/20 blur-[120px] animate-float pointer-events-none z-0" style={{ animationDelay: '3s' }} />

      <main className="relative z-10 mx-auto max-w-7xl p-8 md:p-12">
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="group flex w-fit items-center rounded-2xl border border-slate-200/60 bg-white/70 px-5 py-2.5 text-sm font-bold text-slate-500 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-x-1 hover:text-blue-600 hover:shadow-md"
          >
            <ArrowRight className="mr-2 h-4 w-4 rotate-180 transition-transform group-hover:-translate-x-1" />
            Back to Primary Portal
          </button>
        </div>

        <header className="mb-16 flex flex-col items-start gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl animate-slide-up-fade">
            <h1 className="mb-4 text-4xl font-black tracking-tight text-slate-900 md:text-5xl lg:text-6xl">Family Profiles</h1>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex w-full items-center justify-center rounded-2xl bg-blue-600 px-8 py-4 font-black text-white shadow-xl shadow-blue-600/25 transition-all duration-300 animate-slide-up-fade hover:-translate-y-1 hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-600/30 md:w-auto"
            style={{ animationDelay: '0.1s' }}
          >
            <UserPlus className="mr-3 h-6 w-6" />
            Add Family Member
          </button>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="mb-6 h-12 w-12 rounded-full border-4 border-blue-600/20 border-t-blue-600 animate-spin" />
            <p className="text-lg font-bold text-slate-500 animate-pulse">Initializing family network...</p>
          </div>
        ) : members.length > 0 ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {members.map((member, idx) => (
              <div
                key={member.id}
                className="group relative flex flex-col items-start overflow-hidden rounded-[2rem] border border-white/60 bg-white/70 p-8 shadow-xl shadow-slate-200/50 backdrop-blur-xl transition-all duration-500 animate-slide-up-fade hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-900/10"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="absolute right-0 top-0 -z-0 h-40 w-40 rounded-bl-full bg-gradient-to-br from-blue-400/10 to-indigo-400/10 transition-transform duration-700 group-hover:scale-125" />

                <div className="z-10 mb-8 flex w-full items-start justify-between">
                  <div className="rounded-2xl border border-slate-100 bg-white p-4 text-blue-600 shadow-sm transition-colors duration-500 group-hover:border-blue-600 group-hover:bg-blue-600 group-hover:text-white">
                    <Heart className="h-8 w-8" />
                  </div>
                  <span className="rounded-full border border-blue-100/50 bg-blue-50 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-blue-700 shadow-sm">
                    {member.relationToParent}
                  </span>
                </div>

                <div className="z-10 flex w-full flex-1 flex-col">
                  <h3 className="mb-4 text-3xl font-black tracking-tight text-slate-900 transition-colors group-hover:text-blue-600">{member.name}</h3>
                  <div className="mb-5 flex items-center gap-6 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 text-sm font-bold text-slate-500">
                    <span className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-400" />
                      {member.age} Yrs
                    </span>
                    <div className="h-6 w-px bg-slate-200" />
                    <span className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-indigo-400" />
                      {member.gender}
                    </span>
                  </div>

                  <div className="mb-8 inline-flex items-center rounded-full border border-rose-100 bg-rose-50 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-rose-700 shadow-sm">
                    <Droplets className="mr-2 h-4 w-4" />
                    Blood Group: {member.patientProfile?.bloodGroup || 'Not set'}
                  </div>

                  <div className="mt-auto flex w-full gap-3">
                    <button
                      onClick={() => navigate(`/dashboard/${member.id}`)}
                      className="group/btn flex flex-1 items-center justify-center rounded-2xl bg-slate-800 py-4 font-black text-white shadow-slate-300 transition-all duration-300 hover:bg-slate-900 hover:shadow-lg"
                    >
                      Access Portal
                      <ArrowRight className="ml-3 h-5 w-5 opacity-70 transition-all group-hover/btn:translate-x-1 group-hover/btn:opacity-100" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-12 rounded-[3rem] border-2 border-dashed border-slate-200/80 bg-white/60 py-24 text-center shadow-sm backdrop-blur-xl animate-slide-up-fade">
            <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-[2rem] border border-blue-100/50 bg-blue-50 shadow-inner">
              <Users className="h-12 w-12 text-blue-500" />
            </div>
            <h3 className="mb-4 text-3xl font-black tracking-tight text-slate-800">No Family Profiles Yet</h3>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center rounded-2xl bg-blue-600 px-10 py-5 font-black text-white shadow-xl shadow-blue-600/25 transition-all duration-300 hover:-translate-y-1 hover:bg-blue-700"
            >
              <UserPlus className="mr-3 h-6 w-6" />
              Add First Member
            </button>
          </div>
        )}
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/95 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between border-b border-slate-100 bg-white px-10 py-8">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl border border-blue-100/50 bg-blue-50 p-3 shadow-inner">
                  <UserPlus className="h-7 w-7 text-blue-600" />
                </div>
                <h3 className="text-2xl font-black tracking-tight text-slate-900">Add Dependent</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="rounded-xl p-2.5 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6 p-10">
              <form onSubmit={handleAddMember} className="space-y-6">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-700">Full Name</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 font-medium text-slate-900 outline-none transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                    placeholder="e.g. John Doe"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-700">Date Of Birth</label>
                    <input
                      required
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 font-medium text-slate-900 outline-none transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-700">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 font-medium text-slate-900 outline-none transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                    >
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-700">Detected Age</label>
                    <input
                      type="text"
                      readOnly
                      value={detectedAge === '' ? '' : `${detectedAge} Years`}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-100/80 px-5 py-4 font-medium text-slate-900 outline-none"
                      placeholder="Auto calculated"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="mb-3 block text-xs font-bold uppercase tracking-widest text-slate-700">Blood Group Selection</label>
                    <div className="grid grid-cols-4 gap-2">
                      {BLOOD_GROUP_OPTIONS.map((bg) => (
                        <button
                          key={bg}
                          type="button"
                          onClick={() => setFormData({ ...formData, bloodGroup: bg })}
                          className={`py-3 rounded-xl text-xs font-black transition-all ${
                            formData.bloodGroup === bg
                              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                              : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100'
                          }`}
                        >
                          {bg}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-700">Relation to You</label>
                  <input
                    required
                    type="text"
                    value={formData.relation}
                    onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 font-medium text-slate-900 outline-none transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                    placeholder="e.g. Son, Daughter, Parent"
                  />
                </div>

                <div className="flex gap-4 pt-8">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 rounded-2xl bg-slate-100/80 py-4 font-black text-slate-700 transition-colors hover:bg-slate-200">
                    Cancel Check
                  </button>
                  <button
                    type="submit"
                    disabled={adding}
                    className="flex flex-[2] items-center justify-center rounded-2xl bg-blue-600 py-4 font-black text-white shadow-xl shadow-blue-600/20 transition-all hover:-translate-y-1 hover:bg-blue-700 disabled:opacity-70 disabled:shadow-none disabled:hover:-translate-y-0"
                  >
                    {adding ? <><Loader2 className="mr-3 h-5 w-5 animate-spin" /> Initializing...</> : 'Initialize Profile Database'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyProfiles;
