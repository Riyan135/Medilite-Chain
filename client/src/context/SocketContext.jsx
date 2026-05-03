import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSocket } from '../lib/socket';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import ConsultationCallModal from '../components/ConsultationCallModal';
import { Calendar, User, Clock } from 'lucide-react';
import api from '../api/api';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);

  useEffect(() => {
    let currentSocket;

    const userId = user?.id || user?._id;
    if (userId) {
      currentSocket = getSocket();
      setSocket(currentSocket);

      const joinRoom = () => {
        console.log(`[Socket] Attempting to join room: ${userId}`);
        currentSocket.emit('join_room', { room: userId });
      };

      currentSocket.on('connect', joinRoom);
      if (currentSocket.connected) {
        joinRoom();
      }

      const handleCallInvite = (data) => {
        console.log('[Socket] RECEIVED INCOMING CALL INVITE!', data);
        setIncomingCall({
          callId: data.callId,
          consultationId: data.consultationId,
          mode: data.mode,
          peerUserId: data.caller.id,
          peerUserName: data.caller.name,
          isInitiator: true,
        });
      };

      const handleCallEnd = (data) => {
        setActiveCall((prev) => {
          if (prev?.callId === data.callId) {
            toast('Call ended');
            return null;
          }
          return prev;
        });
        setIncomingCall((prev) => {
          if (prev?.callId === data.callId) {
            return null;
          }
          return prev;
        });
      };

      const handleIncomingAppointment = (appointment) => {
        if (user.role === 'DOCTOR') {
          toast.custom(
            (t) => (
              <div
                className={`${
                  t.visible ? 'animate-enter' : 'animate-leave'
                } max-w-md w-full bg-white shadow-2xl rounded-[2rem] pointer-events-auto flex flex-col p-6 border border-slate-100 overflow-hidden relative`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">New Request</p>
                      <h3 className="font-bold text-slate-900 text-lg">Appointment Booking</h3>
                    </div>
                  </div>
                  <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-slate-400" />
                      <p className="text-sm font-bold text-slate-700">{appointment.patient?.user?.name || 'Patient'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <p className="text-sm font-bold text-slate-700">{appointment.date} at {appointment.time}</p>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-5">
                    <button
                      onClick={async () => {
                        toast.dismiss(t.id);
                        try {
                          await api.patch(`/appointments/${appointment.id}/status`, { status: 'REJECTED' });
                          toast.success('Appointment declined');
                          window.dispatchEvent(new CustomEvent('appointment_updated'));
                        } catch (e) {}
                      }}
                      className="flex-1 py-3 text-sm font-black text-rose-600 bg-rose-50 rounded-xl hover:bg-rose-100 transition-colors"
                    >
                      Decline
                    </button>
                    <button
                      onClick={async () => {
                        toast.dismiss(t.id);
                        try {
                          await api.patch(`/appointments/${appointment.id}/status`, { status: 'ACCEPTED' });
                          toast.success('Appointment accepted');
                          window.dispatchEvent(new CustomEvent('appointment_updated'));
                        } catch (e) {}
                      }}
                      className="flex-1 py-3 text-sm font-black text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              </div>
            ),
            { duration: 15000, position: 'top-right' }
          );
        }
      };

      const handleAppointmentStatusChanged = (appointmentData) => {
        if (appointmentData.status === 'ACCEPTED') {
          toast.success(`Your appointment with Dr. ${appointmentData.doctor?.name || 'Doctor'} was accepted!`);
        } else if (appointmentData.status === 'REJECTED') {
          toast.error(`Your appointment with Dr. ${appointmentData.doctor?.name || 'Doctor'} was declined.`);
        }
        window.dispatchEvent(new CustomEvent('appointment_status_changed', { detail: appointmentData }));
      };

      currentSocket.on('consultation_call_invite', handleCallInvite);
      currentSocket.on('consultation_call_end', handleCallEnd);
      currentSocket.on('incoming_appointment', handleIncomingAppointment);
      currentSocket.on('appointment_status_changed', handleAppointmentStatusChanged);

      return () => {
        currentSocket.off('consultation_call_invite', handleCallInvite);
        currentSocket.off('consultation_call_end', handleCallEnd);
        currentSocket.off('incoming_appointment', handleIncomingAppointment);
        currentSocket.off('appointment_status_changed', handleAppointmentStatusChanged);
        currentSocket.off('connect', joinRoom);
      };
    }
  }, [user]);

  const acceptIncomingCall = () => {
    if (!incomingCall || !socket) return;
    socket.emit('consultation_call_accept', {
      callId: incomingCall.callId,
      consultationId: incomingCall.consultationId,
      targetUserId: incomingCall.peerUserId,
      mode: incomingCall.mode,
      acceptedBy: {
        id: user?.id || user?._id,
        name: user?.name,
      },
    });
    setActiveCall(incomingCall);
    setIncomingCall(null);
  };

  const rejectIncomingCall = () => {
    if (!incomingCall || !socket) return;
    socket.emit('consultation_call_reject', {
      callId: incomingCall.callId,
      consultationId: incomingCall.consultationId,
      targetUserId: incomingCall.peerUserId,
      rejectedBy: {
        id: user?.id || user?._id,
        name: user?.name,
      },
    });
    setIncomingCall(null);
  };

  const closeCall = (notifyPeer = true) => {
    if (notifyPeer && activeCall && socket) {
      socket.emit('consultation_call_end', {
        callId: activeCall.callId,
        consultationId: activeCall.consultationId,
        targetUserId: activeCall.peerUserId,
      });
    }
    setActiveCall(null);
  };

  const startCall = (callId, consultationId, targetUserId, mode, callerInfo) => {
    if (!socket) return;
    setActiveCall({
      callId,
      consultationId,
      mode,
      peerUserId: targetUserId,
      peerUserName: 'Calling...',
      isInitiator: true,
    });

    socket.emit('consultation_call_invite', {
      callId,
      consultationId,
      targetUserId,
      mode,
      caller: callerInfo,
    });
  };

  return (
    <SocketContext.Provider value={{ socket, activeCall, setActiveCall, startCall, closeCall }}>
      {children}
      {incomingCall && (
        <div className="fixed top-6 right-6 z-[9999] bg-white border border-slate-200 shadow-2xl rounded-[2rem] p-6 w-full max-w-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Incoming {incomingCall.mode === 'video' ? 'video' : 'voice'} consultation call
          </p>
          <h3 className="mt-2 text-2xl font-black text-slate-900">{incomingCall.peerUserName}</h3>
          <div className="mt-5 flex gap-3">
            <button onClick={acceptIncomingCall} className="flex-1 py-3 rounded-2xl bg-emerald-600 text-white font-bold">
              Accept
            </button>
            <button onClick={rejectIncomingCall} className="flex-1 py-3 rounded-2xl bg-rose-50 text-rose-600 font-bold">
              Reject
            </button>
          </div>
        </div>
      )}
      {activeCall && socket && (
        <ConsultationCallModal
          call={activeCall}
          socket={socket}
          onClose={closeCall}
        />
      )}
    </SocketContext.Provider>
  );
};
