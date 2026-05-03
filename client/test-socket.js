import { io } from 'socket.io-client';
const socket = io('http://localhost:5000');
socket.on('connect', () => {
  console.log('Connected', socket.id);
  socket.emit('join_room', { room: 'test_room' });
  socket.emit('consultation_call_invite', { targetUserId: 'test_room', caller: { id: 'doctor1' } });
});
socket.on('consultation_call_invite', (data) => {
  console.log('Received invite:', data);
  socket.disconnect();
  process.exit(0);
});
socket.on('connect_error', (err) => {
  console.error('Error', err);
  process.exit(1);
});
setTimeout(() => { console.error('Timeout'); process.exit(1); }, 5000);
