import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { FileText, Search, Filter, Download, ExternalLink, Trash2, BrainCircuit, QrCode, X, Globe, AlertCircle, Share2, Sparkles, Languages, ShieldCheck, Plus, ChevronDown, FlaskConical, Stethoscope, Receipt } from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import MedicalRecordUpload from '../components/MedicalRecordUpload';

const languageOptions = [
  'English',
  'Hindi',
  'Kannada',
  'Marathi',
  'Tamil',
  'Telugu',
  'Urdu',
  'Malayalam',
  'Punjabi',
];

const Records = () => {
  const { user } = useAuth();
  const { memberId } = useParams();
  const patientId = memberId || user?.id;
  const [patientName, setPatientName] = useState(user?.name || '');

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [summarizingId, setSummarizingId] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [activeSummary, setActiveSummary] = useState(null);
  const [activeRecordId, setActiveRecordId] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [activeQR, setActiveQR] = useState(null);
  const [generatingOverview, setGeneratingOverview] = useState(false);
  const [showOverviewModal, setShowOverviewModal] = useState(false);
  const [healthOverview, setHealthOverview] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState('REPORT');
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [showStickyLangMenu, setShowStickyLangMenu] = useState(false);

  useEffect(() => {
    if (patientId) {
      fetchRecords();

      if (memberId) {
        api.get('/family').then(res => {
          const member = res.data.find(m => m.id === memberId);
          if (member) setPatientName(member.name);
        }).catch(console.error);
      } else {
        setPatientName(user?.name || '');
      }
    }
  }, [patientId, memberId, user?.name]);

  const fetchRecords = async () => {
    try {
      const response = await api.get(`/records/patient/${patientId}`);
      setRecords(response.data);
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleSummarize = async (id, langOverride) => {
    const lang = langOverride || selectedLanguage;
    setSummarizingId(id);
    try {
      const response = await api.post(`/records/${id}/summarize`, { language: lang });
      setActiveSummary(response.data.summary);
      setActiveRecordId(id);
      setShowSummaryModal(true);
      toast.success('Summary generated successfully!');
      fetchRecords();
    } catch (error) {
      console.error('Error summarizing record:', error);
      toast.error('Failed to generate summary. Please check your AI configuration.');
    } finally {
      setSummarizingId(null);
    }
  };

  const handleShowQR = async (id) => {
    try {
      const response = await api.get(`/records/${id}/qr`);
      setActiveQR(response.data.qrCode);
      setShowQRModal(true);
    } catch (error) {
      console.error('Error fetching QR code:', error);
    }
  };

  const handleGenerateOverview = async () => {
    if (records.length === 0) {
      alert('No records available to summarize.');
      return;
    }
    setGeneratingOverview(true);
    try {
      const response = await api.post('/records/health-overview', { language: selectedLanguage, patientId });
      setHealthOverview(response.data);
      setShowOverviewModal(true);
      toast.success('Holistic health analysis complete!');
    } catch (error) {
      console.error('Error generating health overview:', error);
      toast.error('Failed to generate health overview.');
    } finally {
      setGeneratingOverview(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this medical record permanently?')) return;
    try {
      await api.delete(`/records/${id}`);
      setRecords(records.filter(r => r.id !== id));
      toast.success('Record deleted');
    } catch (error) {
      console.error('Error deleting record:', error);
      toast.error('Failed to delete record');
    }
  };



  const filteredRecords = records.filter(record => {
    const matchesSearch = record.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'ALL' || record.type === filterType;
    return matchesSearch && matchesFilter;
  });
  const summarizedCount = records.filter((record) => record.summary).length;
  const typeCount = new Set(records.map((record) => record.type)).size;

  const handleDownload = async (fileUrl, title) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${title}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download file directly. Opening in new tab instead.');
      window.open(fileUrl, '_blank');
    }
  };

  const handleShare = async (record) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Medical Record: ${record.title}`,
          text: `Check out my medical record: ${record.title}`,
          url: record.fileUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(record.fileUrl);
      toast.success('Link copied to clipboard!');
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 relative overflow-hidden selection:bg-blue-600/20 selection:text-blue-900 records-page-shell">
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-blue-400/20 to-indigo-400/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 animate-float"></div>
        <div className="absolute bottom-[-12%] left-[-10%] w-[460px] h-[460px] bg-gradient-to-tr from-cyan-300/15 via-sky-300/12 to-transparent rounded-full blur-[120px] animate-[drift_18s_ease-in-out_infinite]"></div>
        <div className="absolute top-[18%] left-[16%] size-20 rounded-full border border-white/40 bg-white/20 animate-[soft-spin_22s_linear_infinite]"></div>
        <div className="absolute bottom-[16%] right-[14%] size-8 rounded-full bg-white/65 shadow-[0_0_30px_rgba(255,255,255,0.8)] animate-[bob_7s_ease-in-out_infinite]"></div>
      </div>
      <Sidebar role="patient" />
      <main className="flex-1 overflow-y-auto p-8 relative z-10">
        <header className="flex flex-col xl:flex-row xl:justify-between items-start xl:items-end mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/60 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-blue-700 shadow-sm backdrop-blur-xl animate-slide-up-fade">
              <Sparkles className="h-4 w-4" />
              Secure Health Archive
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mt-5">Medical Records</h1>
            <p className="text-lg text-slate-500 mt-3 font-medium max-w-2xl">Access, translate, summarize, and share your medical documents from one polished records workspace.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto z-50">
            <div className="relative">
              <button
                onClick={() => setShowUploadMenu(!showUploadMenu)}
                className="flex items-center px-8 py-4 bg-white text-blue-600 rounded-2xl font-black shadow-xl shadow-blue-600/10 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-600/20 transition-all duration-300 w-full sm:w-auto justify-center border border-blue-100 relative z-20"
              >
                <Plus className="w-6 h-6 mr-2" />
                Upload Record
                <ChevronDown className={`w-5 h-5 ml-3 transition-transform ${showUploadMenu ? 'rotate-180' : ''}`} />
              </button>

              {showUploadMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowUploadMenu(false)}></div>
                  <div className="absolute top-full left-0 right-0 sm:left-auto sm:right-0 mt-3 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-50 min-w-[280px] animate-in fade-in slide-in-from-top-4">
                    <div className="grid grid-cols-1 gap-1">
                      <button onClick={() => { setUploadType('REPORT'); setShowUploadModal(true); setShowUploadMenu(false); }} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors text-left group">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors"><FileText className="w-5 h-5" /></div>
                        <div><p className="font-bold text-slate-800 text-sm">Medical Report</p><p className="text-[10px] text-slate-500 font-medium mt-0.5">General medical documents</p></div>
                      </button>
                      <button onClick={() => { setUploadType('LAB_TEST'); setShowUploadModal(true); setShowUploadMenu(false); }} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors text-left group">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors"><FlaskConical className="w-5 h-5" /></div>
                        <div><p className="font-bold text-slate-800 text-sm">Lab Test Result</p><p className="text-[10px] text-slate-500 font-medium mt-0.5">Blood tests, scans, etc.</p></div>
                      </button>
                      <button onClick={() => { setUploadType('PRESCRIPTION'); setShowUploadModal(true); setShowUploadMenu(false); }} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors text-left group">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors"><Stethoscope className="w-5 h-5" /></div>
                        <div><p className="font-bold text-slate-800 text-sm">Prescription</p><p className="text-[10px] text-slate-500 font-medium mt-0.5">Doctor's prescriptions</p></div>
                      </button>
                      <button onClick={() => { setUploadType('BILL'); setShowUploadModal(true); setShowUploadMenu(false); }} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors text-left group">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors"><Receipt className="w-5 h-5" /></div>
                        <div><p className="font-bold text-slate-800 text-sm">Hospital Bill</p><p className="text-[10px] text-slate-500 font-medium mt-0.5">Invoices and receipts</p></div>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleGenerateOverview}
              disabled={generatingOverview || records.length === 0}
              className="flex items-center px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-600/25 hover:bg-indigo-700 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-600/30 transition-all duration-300 disabled:opacity-50 disabled:hover:-translate-y-0 w-full sm:w-auto justify-center z-10"
            >
              {generatingOverview ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-3" />
              ) : (
                <BrainCircuit className="w-6 h-6 mr-3" />
              )}
              Whole Picture Summary
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <RecordsStatCard title="Total Records" value={records.length} subtitle="Uploaded medical files" icon={FileText} tone="blue" />
          <RecordsStatCard title="AI Summaries" value={summarizedCount} subtitle="Records with insights" icon={BrainCircuit} tone="indigo" />
          <RecordsStatCard title="Document Types" value={typeCount} subtitle="Reports, bills, tests, prescriptions" icon={ShieldCheck} tone="emerald" />
        </section>

        <section className="grid grid-cols-1 2xl:grid-cols-[1.35fr_0.65fr] gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-xl p-6 rounded-[2rem] border border-white/60 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row gap-4 animate-slide-up-fade records-panel-lift">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="text"
                placeholder="Search records by title..."
                className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none transition-all font-medium text-slate-900"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
          </div>

          <div className="bg-white/75 backdrop-blur-xl p-6 rounded-[2rem] border border-white/60 shadow-xl shadow-slate-200/50 animate-slide-up-fade records-panel-lift" style={{ animationDelay: '0.08s' }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Language Suggestion</p>
                <h3 className="mt-3 text-2xl font-black text-slate-900">Choose Summary Language</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">Switch the summary and health overview output to the language you prefer before generating AI insights.</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Languages className="h-6 w-6" />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {languageOptions.slice(0, 6).map((language) => (
                <button
                  key={language}
                  type="button"
                  onClick={() => setSelectedLanguage(language)}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition-all duration-300 ${
                    selectedLanguage === language
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  {language}
                </button>
              ))}
            </div>

            <div className="mt-6 relative">
              <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Globe className="h-5 w-5" />
              </div>
              <select
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-4 pl-12 pr-10 font-bold text-slate-700 outline-none transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 appearance-none"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
              >
                {languageOptions.map((language) => (
                  <option key={language} value={language}>{language}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-slate-400 font-medium">Fetching your records...</p>
          </div>
        ) : filteredRecords.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredRecords.map((record, idx) => (
              <div key={record.id} className="bg-white/70 backdrop-blur-xl p-8 rounded-[2rem] border border-white/60 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-blue-900/5 hover:-translate-y-2 hover:scale-[1.01] transition-all duration-500 group animate-slide-up-fade records-panel-lift" style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="flex justify-between items-start mb-6">
                  <div className="p-4 bg-white rounded-2xl group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-lg transition-all duration-300 text-blue-600 border border-slate-100">
                    <FileText className="w-7 h-7" />
                  </div>
                  <div className="flex space-x-2">
                    <a
                      href={record.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-blue-600 transition-colors shadow-sm"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                    <button
                      onClick={() => handleDelete(record.id)}
                      className="p-2.5 bg-slate-50 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-500 transition-colors shadow-sm"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-black text-slate-500 bg-slate-100/50 px-3 py-1 rounded-full uppercase tracking-widest border border-slate-200 border-dashed">
                    {record.type.replace('_', ' ')}
                  </span>
                  <div className="flex gap-2">
                    {record.summary && (
                      <button
                        onClick={() => { setActiveSummary(record.summary); setActiveRecordId(record.id); setShowSummaryModal(true); }}
                        className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-widest flex items-center shadow-sm hover:bg-emerald-100 transition-colors"
                      >
                        <BrainCircuit className="w-3 h-3 mr-1.5" />
                        Summarized
                      </button>
                    )}
                  </div>
                </div>
                <h3 className="text-xl font-black text-slate-900 mt-2 mb-2 truncate group-hover:text-blue-600 transition-colors">{record.title}</h3>
                <p className="text-xs font-bold text-slate-400 mb-8 tracking-wide">
                  {new Date(record.date).toLocaleDateString()} • <span className="text-slate-500">Added by You</span>
                </p>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button
                    onClick={() => handleSummarize(record.id)}
                    disabled={summarizingId === record.id}
                    className="flex justify-center items-center py-3 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl font-black hover:bg-indigo-100 hover:-translate-y-0.5 transition-all text-xs uppercase tracking-widest disabled:opacity-50 disabled:hover:-translate-y-0 shadow-sm"
                  >
                    {summarizingId === record.id ? (
                      <div className="w-4 h-4 border-2 border-indigo-700/20 border-t-indigo-700 rounded-full animate-spin mr-2" />
                    ) : (
                      <BrainCircuit className="w-4 h-4 mr-2" />
                    )}
                    AI Summary
                  </button>
                  <button
                    onClick={() => handleShowQR(record.id)}
                    className="flex justify-center items-center py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-black hover:bg-slate-50 hover:-translate-y-0.5 hover:border-blue-200 transition-all text-xs uppercase tracking-widest shadow-sm"
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    Share QR
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleDownload(record.fileUrl, record.title);
                    }}
                    className="flex flex-1 items-center justify-center py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors shadow-md"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </button>
                  <button
                    onClick={() => handleShare(record)}
                    className="flex flex-1 items-center justify-center py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors border border-slate-200"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share File
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (

          <div className="text-center py-20 bg-white/80 backdrop-blur-xl rounded-3xl border-2 border-dashed border-slate-200 records-panel-lift">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No records found</h3>
            <p className="text-slate-500 max-w-xs mx-auto">
              Try adjusting your search or filter to find what you're looking for.
            </p>
          </div>
        )}
      </main>

      {/* Language Selector Sticky */}
      <div className="fixed bottom-8 right-8 z-40">
        <div 
          className="bg-white/90 backdrop-blur-xl p-4 rounded-3xl shadow-2xl shadow-blue-900/10 border border-white/60 flex items-center gap-4 hover:shadow-blue-900/20 transition-all hover:-translate-y-1 group cursor-pointer"
          onClick={() => setShowStickyLangMenu(!showStickyLangMenu)}
        >
          <div className="p-2 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
            <Globe className="w-5 h-5 text-blue-600 group-hover:animate-spin-once" />
          </div>
          <div className="font-bold text-slate-700 pr-2">
            {selectedLanguage === 'Hindi' ? 'हिन्दी (Hindi)' : 
             selectedLanguage === 'Kannada' ? 'ಕನ್ನಡ (Kannada)' :
             selectedLanguage === 'Marathi' ? 'मराठी (Marathi)' :
             selectedLanguage === 'Tamil' ? 'தமிழ் (Tamil)' :
             selectedLanguage === 'Telugu' ? 'తెలుగు (Telugu)' :
             selectedLanguage === 'Urdu' ? 'اردو (Urdu)' :
             selectedLanguage === 'Malayalam' || selectedLanguage === 'Malyalam' ? 'മലയാളം (Malayalam)' :
             selectedLanguage === 'Punjabi' ? 'ਪੰਜਾਬੀ (Punjabi)' : 
             selectedLanguage}
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${showStickyLangMenu ? 'rotate-180' : ''}`} />
        </div>

        {/* Animated Dropdown Menu */}
        <div className={`absolute bottom-full right-0 mb-4 bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white/60 p-2 min-w-[220px] transform transition-all duration-300 origin-bottom-right ${showStickyLangMenu ? 'scale-100 opacity-100 translate-y-0 visible' : 'scale-95 opacity-0 translate-y-4 invisible'}`}>
          <div className="max-h-[320px] overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-1">
            {languageOptions.map((lang) => {
              const displayLang = lang === 'Hindi' ? 'हिन्दी (Hindi)' : 
                                 lang === 'Kannada' ? 'ಕನ್ನಡ (Kannada)' :
                                 lang === 'Marathi' ? 'मराठी (Marathi)' :
                                 lang === 'Tamil' ? 'தமிழ் (Tamil)' :
                                 lang === 'Telugu' ? 'తెలుగు (Telugu)' :
                                 lang === 'Urdu' ? 'اردو (Urdu)' :
                                 lang === 'Malayalam' || lang === 'Malyalam' ? 'മലയാളം (Malayalam)' :
                                 lang === 'Punjabi' ? 'ਪੰਜਾਬੀ (Punjabi)' : 
                                 lang;
              
              return (
                <button
                  key={lang}
                  onClick={() => {
                    setSelectedLanguage(lang);
                    setShowStickyLangMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-200 font-bold text-sm ${
                    selectedLanguage === lang 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 translate-x-1' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-blue-600 hover:translate-x-1'
                  }`}
                >
                  {displayLang}
                  {selectedLanguage === lang && (
                    <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Summary Modal */}
      {showSummaryModal && activeSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center">
                <div className="p-3 bg-primary/10 rounded-2xl mr-4">
                  <BrainCircuit className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">AI Report Insights</h2>
                  <p className="text-xs text-slate-500">Multilingual Summary Analysis</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-white border text-sm font-semibold rounded-xl flex items-center shadow-sm p-1">
                  <span className="text-xs text-slate-400 pl-3">Translate:</span>
                  <select
                    className="bg-transparent border-none outline-none pl-2 pr-2 py-1 cursor-pointer text-slate-700"
                    value={selectedLanguage}
                    onChange={(e) => {
                      setSelectedLanguage(e.target.value);
                      handleSummarize(activeRecordId, e.target.value);
                    }}
                    disabled={summarizingId === activeRecordId}
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Kannada">Kannada</option>
                    <option value="Marathi">Marathi</option>
                    <option value="Tamil">Tamil</option>
                    <option value="Telugu">Telugu</option>
                    <option value="Urdu">Urdu</option>
                    <option value="Malyalam">Malyalam</option>
                    <option value="Punjabi">Punjabi</option>
                  </select>
                  {summarizingId === activeRecordId && (
                    <div className="w-3 h-3 border-2 border-primary/20 border-t-primary rounded-full animate-spin mr-3" />
                  )}
                </div>
                <button
                  onClick={() => setShowSummaryModal(false)}
                  className="p-2 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto space-y-8">
              <div>
                <h4 className="flex items-center text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mr-2" />
                  Key Findings
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {activeSummary.key_findings.map((finding, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-700 font-medium leading-relaxed">
                      {finding}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Diagnosis</h4>
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-900 font-bold">
                    {activeSummary.diagnosis}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Recommendations</h4>
                  <ul className="space-y-2">
                    {activeSummary.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start text-sm text-slate-600 font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 mr-3 shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-700 font-medium leading-relaxed italic">
                  {activeSummary.disclaimer}
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setShowSummaryModal(false)}
                className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Health Overview Modal */}
      {showOverviewModal && healthOverview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center">
                <div className="p-4 bg-white/10 rounded-2xl mr-5">
                  <BrainCircuit className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black">Holistic Health Status</h2>
                  <p className="text-slate-400 text-xs mt-1 uppercase tracking-widest font-bold">Comprehensive AI Analysis</p>
                </div>
              </div>
              <button
                onClick={() => setShowOverviewModal(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-10 overflow-y-auto space-y-10">
              <div className="bg-blue-50/50 p-6 rounded-4xl border border-blue-100">
                <h4 className="flex items-center text-xs font-black text-blue-600 uppercase tracking-widest mb-4">
                  <div className="w-2 h-2 rounded-full bg-blue-600 mr-2" />
                  Status Overview
                </h4>
                <p className="text-slate-700 text-lg font-medium leading-relaxed">
                  {healthOverview.status_overview}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Key Patterns & Trends</h4>
                  <div className="space-y-4">
                    {healthOverview.key_trends.map((trend, idx) => (
                      <div key={idx} className="flex items-start">
                        <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 mr-4 text-[10px] font-black">
                          ✓
                        </div>
                        <p className="text-sm text-slate-600 font-bold leading-relaxed">{trend}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Areas of Concern</h4>
                  <div className="space-y-4">
                    {healthOverview.concerns.map((concern, idx) => (
                      <div key={idx} className="flex items-start">
                        <div className="w-5 h-5 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0 mt-0.5 mr-4 text-[10px] font-black">
                          !
                        </div>
                        <p className="text-sm text-slate-600 font-bold leading-relaxed">{concern}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-200">
                <h4 className="text-xs font-black text-indigo-200 uppercase tracking-widest mb-6">Long-term Health Roadmap</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {healthOverview.long_term_advice.map((advice, idx) => (
                    <div key={idx} className="p-4 bg-white/10 rounded-2xl border border-white/5 text-sm font-bold flex items-center">
                      {advice}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                  <Globe className="w-5 h-5" />
                </div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider italic">
                  Analysis rendered in {selectedLanguage} • {healthOverview.disclaimer}
                </p>
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setShowOverviewModal(false)}
                className="px-10 py-4 bg-slate-900 text-white rounded-3xl font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
              >
                Return to Records
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Modal */}

      {showQRModal && activeQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl flex flex-col items-center max-w-sm w-full relative">
            <button
              onClick={() => setShowQRModal(false)}
              className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-6 h-6 text-slate-400" />
            </button>
            <div className="p-4 bg-primary/5 rounded-[2rem] mb-8 mt-4">
              <img src={activeQR} alt="Report QR" className="w-64 h-64" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Report Access QR</h2>
            <p className="text-sm text-center text-slate-500 mb-8 leading-relaxed">
              Show this QR code to medical staff to grant them instant access to this specific record and its AI analysis.
            </p>
            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = activeQR;
                link.download = 'report-qr.png';
                link.click();
              }}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
            >
              Download QR Code
            </button>
          </div>
        </div>
      )}
      {showUploadModal && (
        <MedicalRecordUpload
          targetId={patientId}
          initialType={uploadType}
          onClose={() => {
            setShowUploadModal(false);
            fetchRecords();
          }}
        />
      )}
    </div>
  );
};

const RecordsStatCard = ({ title, value, subtitle, icon: Icon, tone }) => {
  const tones = {
    blue: 'from-blue-500/14 to-sky-400/10 text-blue-600',
    indigo: 'from-indigo-500/14 to-violet-400/10 text-indigo-600',
    emerald: 'from-emerald-500/14 to-cyan-400/10 text-emerald-600',
  };

  return (
    <div className="rounded-[2rem] border border-white/70 bg-white/70 backdrop-blur-xl p-6 shadow-xl shadow-slate-200/40 hover:-translate-y-1.5 transition-all duration-500 records-panel-lift">
      <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${tones[tone]} shadow-sm`}>
        <Icon className="h-6 w-6" />
      </div>
      <p className="mt-5 text-sm font-semibold text-slate-500">{title}</p>
      <h2 className="mt-2 text-4xl font-extrabold text-slate-900">{value}</h2>
      <p className="mt-3 text-xs font-black uppercase tracking-[0.2em] text-slate-400">{subtitle}</p>
    </div>
  );
};


export default Records;
