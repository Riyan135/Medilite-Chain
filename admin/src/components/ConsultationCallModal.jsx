import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, PhoneOff, Video, VideoOff } from 'lucide-react';

const iceServers = [{ urls: 'stun:stun.l.google.com:19302' }];

const ConsultationCallModal = ({ call, socket, onClose }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(call?.mode === 'video');
  const [status, setStatus] = useState(call?.isInitiator ? 'Connecting...' : 'Waiting for connection...');

  const attachRemoteMedia = () => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
      remoteVideoRef.current.play?.().catch(() => {});
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStreamRef.current;
      remoteAudioRef.current.play?.().catch(() => {});
    }
  };

  useEffect(() => {
    if (!call || !socket) {
      return undefined;
    }

    let cancelled = false;

    const setup = async () => {
      try {
        const localStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: call.mode === 'video',
        });

        if (cancelled) {
          localStream.getTracks().forEach((track) => track.stop());
          return;
        }

        localStreamRef.current = localStream;
        remoteStreamRef.current = new MediaStream();

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }
        if (remoteVideoRef.current) {
          attachRemoteMedia();
        }

        const peerConnection = new RTCPeerConnection({ iceServers });
        peerConnectionRef.current = peerConnection;

        localStream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, localStream);
        });

        peerConnection.ontrack = (event) => {
          event.streams[0].getTracks().forEach((track) => {
            const existingTrackIds = remoteStreamRef.current.getTracks().map((item) => item.id);
            if (!existingTrackIds.includes(track.id)) {
              remoteStreamRef.current.addTrack(track);
            }
          });
          attachRemoteMedia();
          setStatus('Connected');
        };

        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('consultation_call_signal', {
              targetUserId: call.peerUserId,
              callId: call.callId,
              consultationId: call.consultationId,
              signal: { type: 'candidate', candidate: event.candidate },
            });
          }
        };

        if (call.isInitiator) {
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          socket.emit('consultation_call_signal', {
            targetUserId: call.peerUserId,
            callId: call.callId,
            consultationId: call.consultationId,
            signal: { type: 'offer', sdp: offer },
          });
        }
      } catch (error) {
        console.error('Error starting call:', error);
        setStatus('Unable to access microphone/camera');
      }
    };

    const handleSignal = async (data) => {
      if (data.callId !== call.callId || !peerConnectionRef.current) {
        return;
      }

      const peerConnection = peerConnectionRef.current;

      if (data.signal.type === 'offer') {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.signal.sdp));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit('consultation_call_signal', {
          targetUserId: call.peerUserId,
          callId: call.callId,
          consultationId: call.consultationId,
          signal: { type: 'answer', sdp: answer },
        });
        setStatus('Connecting...');
      }

      if (data.signal.type === 'answer') {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.signal.sdp));
        setStatus('Connected');
      }

      if (data.signal.type === 'candidate' && data.signal.candidate) {
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(data.signal.candidate));
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      }
    };

    const handleCallEnd = (data) => {
      if (data.callId === call.callId) {
        onClose(false);
      }
    };

    socket.on('consultation_call_signal', handleSignal);
    socket.on('consultation_call_end', handleCallEnd);
    setup();

    return () => {
      cancelled = true;
      socket.off('consultation_call_signal', handleSignal);
      socket.off('consultation_call_end', handleCallEnd);
      peerConnectionRef.current?.close();
      localStreamRef.current?.getTracks()?.forEach((track) => track.stop());
      remoteStreamRef.current?.getTracks()?.forEach((track) => track.stop());
    };
  }, [call, socket, onClose]);

  if (!call) return null;

  const toggleMute = () => {
    const audioTrack = localStreamRef.current?.getAudioTracks?.()[0];
    if (!audioTrack) return;
    audioTrack.enabled = !audioTrack.enabled;
    setIsMuted(!audioTrack.enabled);
  };

  const toggleVideo = () => {
    const videoTrack = localStreamRef.current?.getVideoTracks?.()[0];
    if (!videoTrack) return;
    videoTrack.enabled = !videoTrack.enabled;
    setIsVideoEnabled(videoTrack.enabled);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className="w-full max-w-5xl bg-slate-950 text-white rounded-[2rem] overflow-hidden shadow-2xl border border-white/10">
        <audio ref={remoteAudioRef} autoPlay playsInline />
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black">{call.mode === 'video' ? 'Video Consultation' : 'Voice Consultation'}</h2>
            <p className="text-sm text-slate-300 mt-1">
              {call.peerUserName} | {status}
            </p>
          </div>
          <button onClick={() => onClose(true)} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 font-bold">
            Close
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-6">
          <div className="bg-slate-900 rounded-[2rem] overflow-hidden min-h-[320px] flex items-center justify-center relative">
            {call.mode === 'video' ? (
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-blue-500/20 mx-auto flex items-center justify-center text-3xl font-black">
                  {call.peerUserName?.[0] || 'P'}
                </div>
                <p className="mt-4 text-lg font-bold">{call.peerUserName}</p>
                <p className="text-slate-400 text-sm">Audio call in progress</p>
              </div>
            )}
          </div>

          <div className="bg-slate-900 rounded-[2rem] overflow-hidden min-h-[320px] flex items-center justify-center relative">
            {call.mode === 'video' ? (
              <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            ) : (
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-emerald-500/20 mx-auto flex items-center justify-center text-3xl font-black">
                  Dr
                </div>
                <p className="mt-4 text-lg font-bold">Your microphone is live</p>
                <p className="text-slate-400 text-sm">Switch to video any time from the consultation tools.</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-white/10 flex justify-center gap-4">
          <button onClick={toggleMute} className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
          {call.mode === 'video' && (
            <button onClick={toggleVideo} className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
              {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </button>
          )}
          <button onClick={() => onClose(true)} className="w-14 h-14 rounded-full bg-rose-600 flex items-center justify-center hover:bg-rose-700">
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsultationCallModal;
