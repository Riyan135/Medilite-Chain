import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import AdminTopbar from '../components/AdminTopbar';
import { FileText, Search, Filter, Download, ExternalLink, Trash2, BrainCircuit, QrCode, X, Globe, AlertCircle } from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';


const Records = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [summarizingId, setSummarizingId] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [activeSummary, setActiveSummary] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [activeQR, setActiveQR] = useState(null);
  const [generatingOverview, setGeneratingOverview] = useState(false);
  const [showOverviewModal, setShowOverviewModal] = useState(false);
  const [healthOverview, setHealthOverview] = useState(null);



  useEffect(() => {
    if (user?.id) {
      fetchRecords();
    }
  }, [user?.id]);

  const fetchRecords = async () => {
    try {
      const response = await api.get(`/records/patient/${user.id}`);
      setRecords(response.data);
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleSummarize = async (id) => {
    setSummarizingId(id);
    try {
      const response = await api.post(`/records/${id}/summarize`, { language: selectedLanguage });
      setActiveSummary(response.data.summary);
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
      const response = await api.post('/records/health-overview', { language: selectedLanguage });
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

  return (
    <div className="flex min-h-screen bg-[#f0f4f8]">
      <Sidebar role="admin" />
      <main className="flex-1 overflow-y-auto px-4 pb-8 pt-20 md:px-8 md:pt-8">
        <div className="flex justify-between items-center mb-10 flex-wrap gap-4">
          <AdminTopbar
            title="Medical Records"
            subtitle="Access records, generate summaries, and review patient documents in a cleaner workspace."
          />
          <button
            onClick={handleGenerateOverview}
            disabled={generatingOverview || records.length === 0}
            className="flex items-center px-6 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            {generatingOverview ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
            ) : (
              <BrainCircuit className="w-5 h-5 mr-2" />
            )}
            Whole Picture Summary
          </button>
        </div>


        <section className="bg-white p-6 rounded-3xl border border-slate-200 mb-8 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search records by title..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                className="pl-10 pr-8 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none appearance-none font-semibold text-slate-600"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="ALL">All Types</option>
                <option value="REPORT">Reports</option>
                <option value="BILL">Bills</option>
                <option value="PRESCRIPTION">Prescriptions</option>
                <option value="LAB_TEST">Lab Tests</option>
              </select>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-slate-400 font-medium">Fetching your records...</p>
          </div>
        ) : filteredRecords.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredRecords.map(record => (
              <div key={record.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all group">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-4 bg-primary/5 rounded-2xl group-hover:bg-primary group-hover:text-white transition-colors">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="flex space-x-2">
                    <a
                      href={record.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-primary transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleDelete(record.id)}
                      className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-widest">
                    {record.type.replace('_', ' ')}
                  </span>
                  <div className="flex gap-2">
                    {record.summary && (
                      <button
                        onClick={() => { setActiveSummary(record.summary); setShowSummaryModal(true); }}
                        className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center"
                      >
                        <BrainCircuit className="w-3 h-3 mr-1" />
                        Summarized
                      </button>
                    )}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-2 mb-1 truncate">{record.title}</h3>
                <p className="text-xs text-slate-400 mb-6">{new Date(record.date).toLocaleDateString()} • Added by You</p>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button
                    onClick={() => handleSummarize(record.id)}
                    disabled={summarizingId === record.id}
                    className="flex items-center justify-center py-2 bg-indigo-50 text-indigo-700 rounded-xl font-bold hover:bg-indigo-100 transition-colors text-sm disabled:opacity-50"
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
                    className="flex items-center justify-center py-2 bg-slate-50 text-slate-700 rounded-xl font-bold hover:bg-slate-100 transition-colors text-sm"
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    QR Code
                  </button>
                </div>

                <a
                  href={record.fileUrl}
                  download
                  className="w-full flex items-center justify-center py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download File
                </a>
              </div>
            ))}
          </div>
        ) : (

          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
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
      <div className="fixed bottom-8 right-8 z-40 bg-white p-4 rounded-2xl shadow-2xl border border-slate-200 flex items-center gap-3">
        <Globe className="w-5 h-5 text-primary" />
        <select
          className="bg-transparent font-bold text-slate-700 outline-none"
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
        >
          <option value="English">English</option>
          <option value="Hindi">हिन्दी (Hindi)</option>
          <option value="Kannada">ಕನ್ನಡ (Kannada)</option>
        </select>
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
              <button
                onClick={() => setShowSummaryModal(false)}
                className="p-2 hover:bg-slate-200 rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
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
            <div className="p-4 bg-primary/5 rounded-4xl mb-8 mt-4">
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
    </div>
  );
};


export default Records;
