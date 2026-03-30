import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

import authRoutes from './routes/auth.js';
import recordRoutes from './routes/records.js';
import patientRoutes from './routes/patient.js';
import doctorRoutes from './routes/doctor.js';
import adminRoutes from './routes/admin.js';
import reminderRoutes from './routes/reminders.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import symptomRoutes from './routes/symptoms.js';
import emergencyRoutes from './routes/emergency.js';
import familyRoutes from './routes/family.js';
import appointmentRoutes from './routes/appointment.js';

import { startReminderService } from './services/reminderService.js';
import { startInventoryService } from './services/inventoryService.js';
import { authMiddleware } from './middleware/authMiddleware.js';

import { createServer } from 'http';
import { Server } from 'socket.io';

const prisma = new PrismaClient();
const app = express();
const httpServer = createServer(app);

const PORT = process.env.PORT || 5000;

/* ================= SOCKET ================= */
const io = new Server(httpServer, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175'
    ],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_room', (data) => {
    socket.join(data.room);
  });

  socket.on('send_message', (data) => {
    io.to(data.room).emit('receive_message', data);
  });

  // Appointment Signaling
  socket.on('new_appointment_request', (data) => {
    // data should contain { doctorId, appointment }
    io.to(data.doctorId).emit('incoming_appointment', data.appointment);
  });

  socket.on('appointment_status_update', (data) => {
    // data should contain { patientUserId, appointment }
    io.to(data.patientUserId).emit('appointment_status_changed', data.appointment);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

/* ================= MIDDLEWARE ================= */
app.use(helmet());

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const allowedOrigins = [process.env.FRONTEND_URL || 'http://localhost:5173'];
    const isLocalhost = origin.startsWith('http://localhost:');

    if (allowedOrigins.includes(origin) || isLocalhost) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(morgan('dev'));
app.use(express.json());

/* ================= PUBLIC ROUTES ================= */
app.use('/api/auth', authRoutes);

/* ✅ MAKE THIS PUBLIC (FIX) */
app.use('/api/symptoms', symptomRoutes);

/* ================= PROTECTED ROUTES ================= */
app.use(authMiddleware);

app.use('/api/records', recordRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/appointments', appointmentRoutes);

/* ================= HEALTH CHECK ================= */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'MediLite API is running'
  });
});

/* ================= DEBUG 404 ================= */
app.use((req, res) => {
  console.log('❌ 404:', req.method, req.url);
  res.status(404).json({ error: 'Route not found' });
});

/* ================= ERROR HANDLING ================= */
app.use((err, req, res, next) => {
  console.error("🔥 ERROR:", err.stack); // better logging
  res.status(500).json({
    error: err.message || "Something went wrong",
  });
});

/* ================= START SERVER ================= */
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

/* ================= CLEANUP ================= */
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});