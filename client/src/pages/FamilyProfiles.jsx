import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Users, UserPlus, ArrowRight, Activity, Calendar, FileText, Heart, X, Loader2 } from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const FamilyProfiles = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adding, setAdding] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    relation: '',
    gender: 'Male'
  });

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
      setFormData({ name: '', age: '', relation: '', gender: 'Male' });
      fetchMembers();
    } catch (error) {
      toast.error('Failed to add family member');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden selection:bg-blue-600/20 selection:text-blue-900">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-blue-400/20 to-indigo-400/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 animate-float pointer-events-none z-0"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-purple-400/20 to-blue-400/20 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2 animate-float pointer-events-none z-0" style={{animationDelay: '3s'}}></div>
      
      <main className="max-w-7xl mx-auto p-8 md:p-12 relative z-10">
        <div className="mb-8">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-slate-500 hover:text-blue-600 transition-all duration-300 font-bold text-sm bg-white/70 backdrop-blur border border-slate-200/60 px-5 py-2.5 rounded-2xl shadow-sm hover:shadow-md hover:-translate-x-1 w-fit group"
          >
            <ArrowRight className="w-4 h-4 mr-2 rotate-180 group-hover:-translate-x-1 transition-transform" />
            Back to Primary Portal
          </button>
        </div>

        <header className="flex flex-col md:flex-row md:justify-between items-start md:items-end mb-16 gap-6">
          <div className="max-w-2xl animate-slide-up-fade">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight mb-4">Family Profiles</h1>
            <p className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed">Centrally manage and seamlessly switch between synchronized health dashboards for all your loved ones.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-8 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-600/25 hover:bg-blue-700 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-600/30 transition-all duration-300 animate-slide-up-fade w-full md:w-auto justify-center"
            style={{animationDelay: '0.1s'}}
          >
            <UserPlus className="w-6 h-6 mr-3" />
            Add Family Member
          </button>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-6" />
            <p className="text-slate-500 font-bold text-lg animate-pulse">Initializing family network...</p>
          </div>
        ) : members.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {members.map((member, idx) => (
              <div key={member.id} className="bg-white/70 backdrop-blur-xl p-8 rounded-[2rem] border border-white/60 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-2 transition-all duration-500 group flex flex-col items-start relative overflow-hidden animate-slide-up-fade" style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-bl-full -z-0 transition-transform group-hover:scale-125 duration-700" />
                
                <div className="flex justify-between w-full items-start mb-8 z-10">
                  <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-colors duration-500 text-blue-600">
                    <Heart className="w-8 h-8" />
                  </div>
                  <span className="text-xs font-black text-blue-700 bg-blue-50 border border-blue-100/50 px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
                    {member.relationToParent}
                  </span>
                </div>

                <div className="z-10 w-full flex-1">
                  <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight group-hover:text-blue-600 transition-colors">{member.name}</h3>
                  <div className="flex items-center gap-6 text-slate-500 mb-8 font-bold text-sm bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    <span className="flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-400" /> {member.age} Yrs</span>
                    <div className="w-px h-6 bg-slate-200"></div>
                    <span className="flex items-center gap-2"><Users className="w-5 h-5 text-indigo-400" /> {member.gender}</span>
                  </div>
                  
                  <div className="flex gap-3 mt-auto w-full">
                     <button
                        onClick={() => navigate(`/dashboard/${member.id}`)}
                        className="flex-1 flex items-center justify-center py-4 bg-slate-800 text-white rounded-2xl font-black hover:bg-slate-900 hover:shadow-lg shadow-slate-300 transition-all duration-300 group/btn"
                      >
                        Access Portal
                        <ArrowRight className="w-5 h-5 ml-3 opacity-70 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all" />
                      </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white/60 backdrop-blur-xl rounded-[3rem] border-2 border-dashed border-slate-200/80 shadow-sm mt-12 animate-slide-up-fade">
            <div className="w-24 h-24 bg-blue-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner border border-blue-100/50">
              <Users className="w-12 h-12 text-blue-500" />
            </div>
            <h3 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">No Family Profiles Yet</h3>
            <p className="text-slate-500 text-lg max-w-md mx-auto mb-10 font-medium leading-relaxed">
              Create dedicated privacy-first profiles for your children, parents, or spouse to securely manage their medical data.
            </p>
            <button
               onClick={() => setIsModalOpen(true)}
               className="inline-flex items-center px-10 py-5 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-600/25 hover:bg-blue-700 hover:-translate-y-1 transition-all duration-300"
            >
              <UserPlus className="w-6 h-6 mr-3" />
              Add First Member
            </button>
          </div>
        )}
      </main>

      {/* Add Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white/95 backdrop-blur-xl w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden transform animate-in fade-in zoom-in duration-300 border border-white/60">
            <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-white">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100/50 shadow-inner">
                   <UserPlus className="w-7 h-7 text-blue-600" />
                 </div>
                 <h3 className="text-2xl font-black text-slate-900 tracking-tight">Add Dependent</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-10 space-y-6">
              <form onSubmit={handleAddMember} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-widest">Full Name</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none transition-all font-medium text-slate-900" placeholder="e.g. John Doe" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-widest">Age</label>
                    <input required type="number" min="0" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none transition-all font-medium text-slate-900" placeholder="Years" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-widest">Gender</label>
                    <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none transition-all font-medium text-slate-900 appearance-none">
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-widest">Relation to You</label>
                  <input required type="text" value={formData.relation} onChange={e => setFormData({...formData, relation: e.target.value})} className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none transition-all font-medium text-slate-900" placeholder="e.g. Son, Daughter, Parent" />
                </div>

                <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100/50 mt-8 relative overflow-hidden shadow-inner">
                  <div className="absolute right-0 top-0 bottom-0 w-2 bg-blue-500"></div>
                  <p className="text-sm text-blue-900 font-semibold leading-relaxed w-11/12">
                     This dependent will receive an identical dashboard scoped solely to their data, strictly governed by your primary authorization protocols.
                  </p>
                </div>

                <div className="pt-8 flex gap-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100/80 text-slate-700 rounded-2xl font-black hover:bg-slate-200 transition-colors">Cancel Check</button>
                  <button type="submit" disabled={adding} className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 shadow-xl shadow-blue-600/20 hover:-translate-y-1 disabled:opacity-70 disabled:hover:-translate-y-0 disabled:shadow-none transition-all flex justify-center items-center">
                    {adding ? <><Loader2 className="w-5 h-5 animate-spin mr-3" /> Initializing...</> : 'Initialize Profile Database'}
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
