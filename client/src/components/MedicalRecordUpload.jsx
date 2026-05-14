import React, { useState } from 'react';
import { Upload, X, File, Image as ImageIcon, AlertCircle } from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const MedicalRecordUpload = ({ targetId, onClose, initialType = 'REPORT' }) => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState(initialType);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListeningTitle, setIsListeningTitle] = useState(false);
  const [isListeningDesc, setIsListeningDesc] = useState(false);

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
      if (field === 'title') setIsListeningTitle(true);
      if (field === 'description') setIsListeningDesc(true);
      toast.success('Listening... Speak now', { icon: '🎙️' });
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (field === 'title') {
        setTitle((prev) => prev ? `${prev} ${transcript}` : transcript);
      } else if (field === 'description') {
        setDescription((prev) => prev ? `${prev} ${transcript}` : transcript);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      if (field === 'title') setIsListeningTitle(false);
      if (field === 'description') setIsListeningDesc(false);
      toast.error('Error recognizing voice. Please try again.');
    };

    recognition.onend = () => {
      if (field === 'title') setIsListeningTitle(false);
      if (field === 'description') setIsListeningDesc(false);
    };

    recognition.start();
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title || !user?.id) return;

    setLoading(true);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('type', type);
    formData.append('patientId', targetId || user?.id);
    formData.append('description', description);

    try {
      await api.post('/records/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Medical record uploaded successfully!');
      onClose();
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload record. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Upload Medical Record</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-slate-700">Record Title</label>
              <button
                type="button"
                onClick={() => handleVoiceCommand('title')}
                disabled={isListeningTitle}
                className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${isListeningTitle ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                title="Use voice to text"
              >
                {isListeningTitle ? <div className="w-4 h-4 rounded-full border-2 border-red-500 border-t-transparent animate-spin" /> : <span className="text-lg leading-none">🎙️</span>}
              </button>
            </div>
            <input 
              type="text" 
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Annual Blood Test Report"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Record Type</label>
            <select 
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={!!initialType}
              className={`w-full px-4 py-3 rounded-xl border border-slate-200 outline-none transition-all text-slate-900 ${!!initialType ? 'bg-slate-50 cursor-not-allowed opacity-70' : 'focus:ring-2 focus:ring-primary/20 focus:border-primary'}`}
            >
              <option value="REPORT">Medical Report</option>
              <option value="BILL">Hospital Bill</option>
              <option value="PRESCRIPTION">Prescription</option>
              <option value="LAB_TEST">Lab Test Result</option>
            </select>
            {!!initialType && (
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">
                Category Locked: {type.replace('_', ' ')}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-slate-700">Description (Optional)</label>
              <button
                type="button"
                onClick={() => handleVoiceCommand('description')}
                disabled={isListeningDesc}
                className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${isListeningDesc ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                title="Use voice to text"
              >
                {isListeningDesc ? <div className="w-4 h-4 rounded-full border-2 border-red-500 border-t-transparent animate-spin" /> : <span className="text-lg leading-none">🎙️</span>}
              </button>
            </div>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Details about the consultation or test results..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900 h-24 resize-none"
            />
          </div>

          <div className="relative group">
            <input 
              type="file" 
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              accept=".pdf,image/*"
            />
            <div className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all ${file ? 'border-primary bg-primary/5' : 'border-slate-200 group-hover:border-primary/50 group-hover:bg-slate-50'}`}>
              {!file ? (
                <>
                  <div className="p-4 bg-slate-100 rounded-full mb-4">
                    <Upload className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">Click to upload or drag and drop</p>
                  <p className="text-xs text-slate-400 mt-1">PDF, PNG, JPG (max. 10MB)</p>
                </>
              ) : (
                <div className="flex items-center">
                  {file.type.includes('image') ? <ImageIcon className="w-8 h-8 text-primary mr-3" /> : <File className="w-8 h-8 text-primary mr-3" />}
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-800 truncate max-w-[200px]">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              Ensure the uploaded file is clear and readable. This information will be stored securely and can be accessed by authorized doctors.
            </p>
          </div>

          <button 
            type="submit"
            disabled={!file || !title || loading}
            className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg ${!file || !title || loading ? 'bg-slate-300 shadow-none' : 'bg-primary hover:shadow-primary/25 hover:translate-y-[-2px] active:translate-y-0'}`}
          >
            {loading ? 'Uploading...' : 'Save Record'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MedicalRecordUpload;
