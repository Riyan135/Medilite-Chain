import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { QrCode, Search, User, ShieldCheck, Clock, ArrowRight, MessageSquare } from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import QRScannerModal from '../components/QRScannerModal';
import toast from 'react-hot-toast';
import Chat from '../components/Chat';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [searchId, setSearchId] = useState('');
  const [recentPatients, setRecentPatients] = useState([]);
  const [activeChat, setActiveChat] = useState(null);

  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showScanner, setShowScanner] = useState(false);


  useEffect(() => {
    if (user?.id) {
      fetchRecentConsultations();
    }
  }, [user?.id]);

  const fetchRecentConsultations = async () => {
    try {
      const response = await api.get('/doctors/recent');
      setRecentPatients(response.data);
    } catch (error) {
      console.error('Error fetching recent consultations:', error);
    }
  };

  const navigate = useNavigate();

  const handleSearch = async (e) => {
    if (e.key === 'Enter' && searchId) {
      setLoading(true);
      try {
        const response = await api.get(`/doctors/search?query=${searchId}`);
        setSearchResults(response.data);
        if (response.data.length === 0) {
          toast.error('No patients found with that ID');
        } else {
          toast.success(`Found ${response.data.length} results`);
        }
      } catch (error) {
        console.error('Error searching patients:', error);
        toast.error('Failed to search patients');
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePatientSelect = (id) => {
    navigate(`/doctor/patient/${id}`);
  };

  const onScanSuccess = (decodedText) => {
    // If it's a patient access token
    if (decodedText.startsWith('medilite-access-token-')) {
      const parts = decodedText.split('-');
      const clerkId = parts[3]; // format: medilite-access-token-{clerkId}-{timestamp}
      if (clerkId) {
        setShowScanner(false);
        handlePatientSelect(clerkId);
      }
    } 
    // If it's a specific report QR (JSON format)
    try {
      const data = JSON.parse(decodedText);
      if (data.recordId && data.patientId) {
        setShowScanner(false);
        // For now, redirect to patient page, but we could add a direct report view
        handlePatientSelect(data.patientId);
      }
    } catch (e) {
      // Not JSON, ignore
    }
  };


  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar role="doctor" />
      <main className="flex-1 overflow-y-auto p-8">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Doctor Dashboard</h1>
            <p className="text-slate-500 mt-1">Scan patient QR or search by ID to access records.</p>
          </div>
          <div className="flex space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search patient ID..." 
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                onKeyDown={handleSearch}
                className="pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none w-64 transition-all"
              />
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white p-10 rounded-3xl border border-slate-200 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-primary/5 rounded-3xl flex items-center justify-center mb-6">
                <QrCode className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">QR Access Control</h2>
              <p className="text-slate-500 max-w-sm mb-8">
                Enter the patient's temporary access token or scan their QR code to proceed.
              </p>
              <div className="flex w-full max-w-sm space-x-2">
                <input 
                  type="text" 
                  placeholder="Enter access token..."
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                />
                <button 
                  onClick={() => {
                    let id = searchId;
                    if (searchId.includes('medilite-access-token-')) {
                      id = searchId.split('-').reverse()[1];
                    }
                    if (id) handlePatientSelect(id);
                  }}
                  className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:scale-105 transition-transform"
                >
                  Access
                </button>
              </div>
              <div className="mt-6">
                <button 
                  onClick={() => setShowScanner(true)}
                  className="px-8 py-3 bg-white border-2 border-primary text-primary rounded-2xl font-black hover:bg-primary hover:text-white transition-all flex items-center shadow-lg shadow-primary/10"
                >
                  <QrCode className="w-5 h-5 mr-3" />
                  Open Camera Scanner
                </button>
              </div>
            </section>


            <section className="bg-white p-8 rounded-3xl border border-slate-200">
              <h3 className="text-xl font-bold text-slate-800 mb-6">Recent Consultations</h3>
              <div className="space-y-4">
                {loading ? (
                  <p className="text-slate-400">Searching...</p>
                ) : (searchResults.length > 0 ? searchResults : recentPatients).length > 0 ? (
                  (searchResults.length > 0 ? searchResults : recentPatients).map(patient => (
                    <div 
                      key={patient.id} 
                      onClick={() => handlePatientSelect(patient.id)}
                      className="flex items-center p-4 rounded-2xl border border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mr-4">
                        <User className="w-6 h-6 text-slate-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900">{patient.name}</h4>
                        <p className="text-sm text-slate-500">{patient.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveChat({ id: patient.id, name: patient.name });
                          }}
                          className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-all"
                          title="Chat with Patient"
                        >
                          <MessageSquare className="w-5 h-5" />
                        </button>
                        <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-all" />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400">Search for patients or consult to see them here.</p>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-8">
            <div className="bg-white p-8 rounded-3xl border border-slate-200">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <ShieldCheck className="w-6 h-6 text-emerald-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Verified Access</h3>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                Your credentials have been verified by the medical board. All scans are logged for patient safety.
              </p>
              <div className="flex items-center text-xs text-slate-400 font-medium">
                <Clock className="w-4 h-4 mr-2" />
                Session expires in 4 hours
              </div>
            </div>
          </aside>
        </div>
      </main>
      
      <QRScannerModal 
        isOpen={showScanner} 
        onClose={() => setShowScanner(false)} 
        onScanSuccess={onScanSuccess} 
      />
      {activeChat && (
        <Chat 
          otherUserId={activeChat.id} 
          otherUserName={activeChat.name} 
          onClose={() => setActiveChat(null)} 
        />
      )}
    </div>
  );
};


export default DoctorDashboard;
