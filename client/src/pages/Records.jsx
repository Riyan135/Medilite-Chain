import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import { 
  FileText, Search, Filter, Download, ExternalLink, BrainCircuit, 
  QrCode, X, Sparkles, ShieldCheck, Plus, ChevronDown, 
  FlaskConical, Stethoscope, Receipt, Clock, ArrowUpRight, Pill
} from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import MedicalRecordUpload from '../components/MedicalRecordUpload';

const StatCard = ({ title, value, icon: Icon, subtitle }) => (
  <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex-1 group hover:shadow-xl transition-all duration-500">
    <div className="flex items-center gap-4 mb-6">
      <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
        <Icon size={24} />
      </div>
    </div>
    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{title}</p>
    <h2 className="text-5xl font-black text-slate-900 mb-4">{value}</h2>
    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{subtitle}</p>
  </div>
);

const WholePictureSummaryModal = ({ onClose, patientId }) => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await api.post('/records/health-overview', { 
        patientId, 
        language: 'English' 
      });
      setSummary(res.data);
    } catch (error) {
      console.error('Error fetching summary:', error);
      toast.error(error.response?.data?.error || 'Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white"
      >
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">AI Health Intelligence</p>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Whole Picture Summary</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-[10px]">Analyzing your medical history...</p>
            </div>
          ) : summary ? (
            <div className="prose prose-slate max-w-none">
              <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-6 text-slate-700 font-medium leading-relaxed whitespace-pre-line">
                {summary}
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-slate-400">
              No clinical data available to summarize.
            </div>
          )}
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-slate-900 text-white rounded-xl text-sm font-black hover:bg-slate-800 transition-all shadow-lg"
          >
            Acknowledge
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const Records = () => {
  const { user } = useAuth();
  const { memberId } = useParams();
  const navigate = useNavigate();
  const patientId = memberId || user?.id;

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [showSummary, setShowSummary] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadType, setUploadType] = useState('REPORT');
  const [showUploadMenu, setShowUploadMenu] = useState(false);

  useEffect(() => {
    if (patientId) {
      fetchRecords();
    }
  }, [patientId]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/records/patient/${patientId}`);
      setRecords(response.data);
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const matchesSearch = record.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'ALL' || record.type === filterType;
      return matchesSearch && matchesFilter;
    });
  }, [records, searchTerm, filterType]);

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-gradient-to-br from-white via-slate-50 to-blue-50/30">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/20 mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Secure Health Archive</span>
            </div>
            <h1 className="text-6xl font-black text-slate-900 tracking-tight mb-4">Medical Records</h1>
            <p className="text-slate-500 font-bold text-lg leading-relaxed">
              Access, translate, summarize, and share your medical documents from one polished records workspace.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 relative">
            <div className="relative">
              <button 
                onClick={() => setShowUploadMenu(!showUploadMenu)}
                className="flex items-center gap-3 px-8 py-4 bg-white border-2 border-blue-100 text-blue-600 rounded-2xl text-sm font-black shadow-xl shadow-slate-200/50 hover:bg-blue-50 transition-all hover:-translate-y-1"
              >
                <Plus className="w-5 h-5" />
                Upload Record
                <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showUploadMenu ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showUploadMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-[60] overflow-hidden"
                  >
                    {[
                      { label: 'Medical Report', type: 'REPORT', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
                      { label: 'Prescription', type: 'PRESCRIPTION', icon: Pill, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                      { label: 'Hospital Bill', type: 'BILL', icon: Receipt, color: 'text-amber-600', bg: 'bg-amber-50' },
                      { label: 'Lab Test', type: 'LAB_TEST', icon: FlaskConical, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={() => {
                          setUploadType(item.type);
                          setShowUpload(true);
                          setShowUploadMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors text-left group"
                      >
                        <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}>
                          <item.icon size={18} />
                        </div>
                        <span className="text-sm font-bold text-slate-700">{item.label}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={() => setShowSummary(true)}
              className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-500 via-indigo-600 to-blue-600 text-white rounded-2xl text-sm font-black shadow-xl shadow-indigo-600/30 hover:shadow-2xl hover:shadow-indigo-600/40 transition-all hover:-translate-y-1"
            >
              <BrainCircuit className="w-5 h-5" />
              Whole Picture Summary
            </button>
          </div>
        </header>

        <section className="flex flex-wrap gap-8 mb-16">
          <StatCard 
            title="Total Records" 
            value={records.length} 
            icon={FileText} 
            subtitle="UPLOADED MEDICAL FILES" 
          />
          <StatCard 
            title="AI Summaries" 
            value={records.filter(r => r.summary).length} 
            icon={BrainCircuit} 
            subtitle="RECORDS WITH INSIGHTS" 
          />
          <StatCard 
            title="Document Types" 
            value={new Set(records.map(r => r.type)).size} 
            icon={ShieldCheck} 
            subtitle="REPORTS, BILLS, TESTS, PRESCRIPTIONS" 
          />
        </section>

        <div className="mb-12">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm">
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
              <input 
                type="text"
                placeholder="Search records by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-16 pr-8 py-5 bg-slate-50/50 border border-slate-100 rounded-[1.5rem] text-slate-900 font-bold outline-none focus:ring-4 focus:ring-blue-600/5 focus:bg-white transition-all text-lg"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[3rem] border border-slate-100 p-12 shadow-sm min-h-[400px] flex flex-col items-center justify-center text-center">
          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Accessing vault...</p>
            </div>
          ) : filteredRecords.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8 w-full">
              {filteredRecords.map((record) => (
                <div key={record.id} className="group relative rounded-[2rem] bg-white border border-slate-100 p-8 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden hover:-translate-y-2">
                  <div className="flex items-start justify-between mb-8">
                    <div className="w-16 h-16 rounded-[1.25rem] bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                      <FileText size={32} />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => window.open(record.fileUrl, '_blank')} className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                        <ExternalLink size={20} />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight line-clamp-1">{record.title}</h3>
                  <div className="flex items-center gap-3 mb-8">
                    <span className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest">{record.type.replace('_', ' ')}</span>
                  </div>
                  <div className="mt-auto flex items-center justify-between border-t border-slate-50 pt-8">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock size={14} />
                      <p className="text-[10px] font-black uppercase tracking-widest">{new Date(record.createdAt).toLocaleDateString()}</p>
                    </div>
                    <button onClick={() => window.open(record.fileUrl, '_blank')} className="text-blue-600 font-black text-xs uppercase tracking-[0.2em] hover:translate-x-1 transition-transform flex items-center gap-2">
                      View Asset <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="max-w-sm">
              <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 mb-8 mx-auto">
                <FileText size={48} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">No records found</h3>
              <p className="text-slate-500 font-bold text-sm leading-relaxed">
                Try adjusting your search or filter to find what you're looking for.
              </p>
            </div>
          )}
        </div>
      </main>

      {showSummary && (
        <WholePictureSummaryModal 
          patientId={patientId}
          onClose={() => setShowSummary(false)}
        />
      )}

      {showUpload && (
        <MedicalRecordUpload 
          targetId={patientId}
          initialType={uploadType}
          onClose={() => {
            setShowUpload(false);
            fetchRecords();
          }}
        />
      )}
    </div>
  );
};

export default Records;
