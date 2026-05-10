import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import HealthTimelineComponent from '../components/HealthTimeline';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

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
          // Transform records for timeline
          const formatted = response.data.map(r => ({
            ...r,
            date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          }));
          setRecords(formatted);
        } catch (error) {
          console.error('Error fetching timeline:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchRecords();
    }
  }, [patientId]);

  return (
    <div className="flex h-screen bg-transparent">
      <Sidebar role="patient" />
      <main className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-400 font-medium animate-pulse">Loading your health history...</p>
          </div>
        ) : (
          <HealthTimelineComponent records={records} />
        )}
      </main>
    </div>
  );
};

export default HealthTimeline;
