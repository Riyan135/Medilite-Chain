import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import toast from 'react-hot-toast';
import {
  Activity,
  Thermometer,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Info,
  Mic,
  X
} from 'lucide-react';

const SymptomChecker = () => {
  const { user } = useAuth();
  const [symptoms, setSymptoms] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [todayDate, setTodayDate] = useState('');

  useEffect(() => {
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    setTodayDate(new Date().toLocaleDateString(undefined, options));
  }, []);

  // 🎙️ Voice input
  const handleVoiceCommand = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error('Voice not supported');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setSymptoms((prev) => (prev ? prev + ' ' + text : text));
    };

    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  // ❌ Clear input
  const handleClear = () => {
    setSymptoms('');
    setResult(null);
  };

  // 🔥 API call
  const checkSymptoms = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post('/symptoms/analyze', {
        symptoms,
        language: 'English'
      });

      setResult(res.data);
      toast.success('Analysis complete!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to analyze symptoms');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level) => {
    const l = level?.toLowerCase();
    if (l === 'high') return 'bg-red-100 text-red-700';
    if (l === 'medium') return 'bg-orange-100 text-orange-700';
    return 'bg-green-100 text-green-700';
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Sidebar role="patient" />

      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <Activity className="text-blue-600" />
          AI Symptom Checker
        </h1>

        {/* INPUT CARD */}
        <div className="bg-white p-6 rounded-3xl shadow-lg border">
          <form onSubmit={checkSymptoms}>
            <div className="relative">
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Describe your symptoms..."
                className="w-full p-4 pr-28 border rounded-2xl h-32 resize-none focus:ring-2 focus:ring-blue-400"
              />

              {/* 🎙️ Speak Button */}
              <button
                type="button"
                onClick={handleVoiceCommand}
                className={`absolute right-16 bottom-3 p-2 rounded-lg ${isListening
                    ? 'bg-red-100 text-red-600 animate-pulse'
                    : 'bg-blue-100 text-blue-600'
                  }`}
              >
                <Mic size={18} />
              </button>

              {/* ❌ Clear Button */}
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 bottom-3 p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
              >
                <X size={18} />
              </button>
            </div>

            <button
              type="submit"
              disabled={!symptoms || loading}
              className="mt-4 w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition"
            >
              {loading ? 'Analyzing...' : 'Analyze Symptoms'}
            </button>
          </form>
        </div>

        {/* RESULT */}
        {result && !loading && (
          <div className="mt-8 bg-white p-6 rounded-3xl shadow-xl border">
            <h2 className="text-2xl font-bold mb-3">
              {result.predicted_disease}
            </h2>

            <div
              className={`inline-block px-3 py-1 rounded-lg ${getRiskColor(
                result.risk_level
              )}`}
            >
              Risk: {result.risk_level}
            </div>

            <div className="mt-4 space-y-3">
              <p>
                <strong>Doctor Suggestion:</strong>{' '}
                {result.doctor_suggestion}
              </p>
              <p>
                <strong>Care Type:</strong> {result.care_type}
              </p>
              <p>
                <strong>Precautions:</strong> {result.precautions}
              </p>
              <p>
                <strong>Advice:</strong> {result.advice}
              </p>
            </div>

            <div className="mt-4 p-3 bg-yellow-50 border rounded-lg text-sm text-yellow-800 flex gap-2">
              <ShieldAlert size={18} />
              {result.disclaimer}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SymptomChecker;