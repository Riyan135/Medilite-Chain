import React from 'react';
import Sidebar from '../components/Sidebar';
import MedicineReminderComponent from '../components/MedicineReminder';

const MedicineReminders = () => {
  return (
    <div className="flex h-screen bg-transparent">
      <Sidebar role="patient" />
      <main className="flex-1 overflow-y-auto">
        <MedicineReminderComponent />
      </main>
    </div>
  );
};

export default MedicineReminders;
