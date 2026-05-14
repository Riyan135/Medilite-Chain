import React, { useEffect, useState } from 'react';
import { ShieldAlert, Stethoscope, UserRound, UsersRound, Flag, Ban, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

import Sidebar from '../components/Sidebar';
import AdminTopbar from '../components/AdminTopbar';
import api from '../api/api';

const UserGovernance = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.get('/admin/users')
      .then((response) => setUsers(response.data))
      .catch((error) => {
        console.error('Error loading users:', error);
        toast.error('Failed to load user governance');
      });
  }, []);

  const handleBlock = async (id, currentStatus) => {
    try {
      await api.patch(`/admin/user/${id}/block`);
      setUsers(users.map(u => (u.id === id || u._id === id) ? { ...u, isBlocked: !currentStatus } : u));
      toast.success(`User ${!currentStatus ? 'blocked' : 'unblocked'} successfully`);
    } catch (error) {
      toast.error('Failed to update block status');
    }
  };

  const handleFlag = async (id, currentStatus) => {
    try {
      await api.patch(`/admin/user/${id}/flag`);
      setUsers(users.map(u => (u.id === id || u._id === id) ? { ...u, isFlagged: !currentStatus } : u));
      toast.success(`User ${!currentStatus ? 'flagged' : 'unflagged'} successfully`);
    } catch (error) {
      toast.error('Failed to update flag status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this user?')) return;
    try {
      await api.delete(`/admin/user/${id}`);
      setUsers(users.filter(u => u.id !== id && u._id !== id));
      toast.success('User deleted successfully');
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };


  const doctors = users.filter((user) => user.role === 'DOCTOR');
  const patients = users.filter((user) => user.role === 'PATIENT');
  const admins = users.filter((user) => user.role === 'ADMIN');

  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar />
      <motion.main initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex-1 overflow-y-auto px-4 pb-8 pt-20 md:px-8 md:pt-8">
        <AdminTopbar
          title="User Governance"
          subtitle="Govern the ecosystem of admins, doctors, and patients without stepping into direct care delivery."
        />

        <section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <Metric title="Admin Accounts" value={admins.length} icon={ShieldAlert} />
          <Metric title="Doctor Accounts" value={doctors.length} icon={Stethoscope} />
          <Metric title="Patient Accounts" value={patients.length} icon={UsersRound} />
        </section>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
          <UserTable title="Doctor Governance" rows={doctors} emptyText="No doctor accounts available yet." onBlock={handleBlock} onFlag={handleFlag} onDelete={handleDelete} />
          <UserTable title="Patient Governance" rows={patients} emptyText="No patient accounts available yet." onBlock={handleBlock} onFlag={handleFlag} onDelete={handleDelete} />
        </div>
      </motion.main>
    </div>
  );
};

const Metric = ({ title, value, icon: Icon }) => (
  <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300">
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-600 shadow-inner">
      <Icon className="h-6 w-6" />
    </div>
    <p className="mt-5 text-sm font-bold tracking-wide text-slate-400 uppercase">{title}</p>
    <p className="mt-2 text-4xl font-black text-slate-900 tracking-tight">{value}</p>
  </div>
);

const UserTable = ({ title, rows, emptyText, onBlock, onFlag, onDelete }) => (
  <section className="rounded-[2rem] border border-slate-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-300 overflow-hidden flex flex-col">
    <div className="border-b border-slate-100 px-6 py-5 bg-slate-50/50">
      <h2 className="text-xl font-black text-slate-900">{title}</h2>
    </div>
    {rows.length === 0 ? (
      <div className="p-12 text-slate-400 text-center text-sm font-medium">{emptyText}</div>
    ) : (
      <div className="divide-y divide-slate-100">
        {rows.map((row, index) => (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05, duration: 0.3 }} key={row.id || row._id} className={`flex items-center justify-between px-6 py-4 transition-all duration-300 hover:bg-slate-50/80 group ${row.isBlocked ? 'bg-red-50/40' : row.isFlagged ? 'bg-orange-50/40' : ''}`}>
            <div className="flex items-center gap-4">
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl shadow-sm transition-colors duration-300 ${row.isBlocked ? 'bg-red-100 text-red-600' : row.isFlagged ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <p className={`font-bold transition-colors ${row.isBlocked ? 'text-red-900' : row.isFlagged ? 'text-orange-900' : 'text-slate-900'}`}>{row.name}</p>
                <p className="text-sm text-slate-500">{row.email || 'No email available'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {row.isBlocked ? (
                <span className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-700 border border-red-200">Blocked</span>
              ) : (
                <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider border ${row.isVerified === false ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                  {row.isVerified === false ? 'Review' : 'Active'}
                </span>
              )}
              
              <div className="flex items-center gap-1.5 border-l border-slate-200/60 pl-3 ml-1 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                <button onClick={() => onFlag(row.id || row._id, row.isFlagged)} className={`p-2 rounded-xl transition-all duration-300 active:scale-95 ${row.isFlagged ? 'bg-orange-500 text-white shadow-md scale-105' : 'bg-white border border-slate-200 text-slate-400 hover:text-orange-500 hover:border-orange-200 hover:bg-orange-50 shadow-sm hover:scale-105'}`} title={row.isFlagged ? 'Unflag User' : 'Flag User'}>
                  <Flag className="w-4 h-4" />
                </button>
                <button onClick={() => onBlock(row.id || row._id, row.isBlocked)} className={`p-2 rounded-xl transition-all duration-300 active:scale-95 ${row.isBlocked ? 'bg-red-500 text-white shadow-md scale-105' : 'bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 shadow-sm hover:scale-105'}`} title={row.isBlocked ? 'Unblock User' : 'Block User'}>
                  <Ban className="w-4 h-4" />
                </button>
                <button onClick={() => onDelete(row.id || row._id)} className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:bg-red-500 hover:border-red-500 hover:text-white transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm" title="Delete User">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    )}
  </section>
);

export default UserGovernance;
