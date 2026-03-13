import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import HealthTimelineComponent from '../components/HealthTimeline';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

const HealthTimeline = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      const fetchRecords = async () => {
        try {
          const response = await api.get(`/records/patient/${user.id}`);
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
  }, [user]);

  return (
    <div className="flex h-screen bg-slate-50">
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
