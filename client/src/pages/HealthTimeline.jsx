import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import HealthTimelineComponent from '../components/HealthTimeline';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { Clock, Sparkles } from 'lucide-react';

const HealthTimeline = () => {
  const { user } = useAuth();
  const { memberId } = useParams();
  const patientId = memberId || user?.id;

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (patientId) {
      const fetchRecords = async () => {
        try {
          const response = await api.get(`/records/patient/${patientId}`);
          const formatted = response.data.map(r => ({
            ...r,
            date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          }));
          setRecords(formatted);
        } catch (error) {
          console.error('Error fetching timeline:', error);
          if (error.response?.status === 403 && memberId) {
            window.location.href = '/timeline';
          }
        } finally {
          setLoading(false);
        }
      };
      fetchRecords();
    }
  }, [patientId, memberId]);

  return (
    <div className="flex h-screen bg-transparent font-sans text-slate-900 transition-colors duration-300 relative overflow-hidden">
      {/* Background Ambience */}
      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-[120px] pointer-events-none" 
      />
      <motion.div 
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[40%] bg-indigo-100/50 rounded-full blur-[120px] pointer-events-none" 
      />
      
      <Sidebar />
      <main className="flex-1 overflow-y-auto z-10 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-full bg-slate-50">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-slate-400 font-black animate-pulse uppercase tracking-[0.2em] text-[10px]">Sequencing Health Events...</p>
            </motion.div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="p-6 md:p-10"
          >
             <header className="mb-12">
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black tracking-[0.2em] uppercase backdrop-blur-sm border border-blue-100 mb-2">
                 <Clock className="h-3.5 w-3.5" />
                 Chronological Mapping
               </div>
               <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Health Journey</h1>
               <p className="text-slate-500 font-bold text-lg max-w-2xl opacity-80 mt-2">
                 A chronological map of your medical history and clinical milestones.
               </p>
             </header>
             <div className="bg-white/70 backdrop-blur-xl rounded-[3rem] border border-slate-200/50 shadow-xl p-8 md:p-12">
               <HealthTimelineComponent records={records} />
             </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default HealthTimeline;
