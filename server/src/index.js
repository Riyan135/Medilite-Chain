import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';

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
import consultationRoutes from './routes/consultations.js';
import medicineRoutes from './routes/medicines.js';
import stockRoutes from './routes/stock.js';
import { authMiddleware } from './middleware/authMiddleware.js';
import { connectMongo } from './lib/mongoose.js';
import { ensureAdminUser } from './services/bootstrapUsers.js';
import { startReminderScheduler } from './services/reminderScheduler.js';

const app = express();
const PORT = process.env.PORT || 5000;
const LOG_LEVEL = process.env.LOG_LEVEL || 'minimal';
const isVerboseLogging = LOG_LEVEL === 'debug' || LOG_LEVEL === 'verbose';
const isVercel = process.env.VERCEL === '1';
const httpServer = isVercel ? null : createServer(app);
const ioStub = {
  emit: () => {},
  to: () => ({ emit: () => {} }),
};

const io = isVercel
  ? ioStub
  : new Server(httpServer, {
      cors: {
        origin: '*',
        credentials: true,
      },
    });
app.set('io', io);

if (!isVercel) {
  io.on('connection', (socket) => {
    if (isVerboseLogging) {
      console.log('User connected:', socket.id);
    }

    socket.on('join_room', (data) => {
      socket.join(data.room);
    });

    socket.on('send_message', (data) => {
      io.to(data.room).emit('receive_message', data);
    });

    socket.on('new_appointment_request', (data) => {
      io.to(data.doctorId).emit('incoming_appointment', data.appointment);
    });

    socket.on('appointment_status_update', (data) => {
      io.to(data.patientUserId).emit('appointment_status_changed', data.appointment);
    });

    socket.on('consultation_call_invite', (data) => {
      io.to(data.targetUserId).emit('consultation_call_invite', data);
    });

    socket.on('consultation_call_accept', (data) => {
      io.to(data.targetUserId).emit('consultation_call_accept', data);
    });

    socket.on('consultation_call_reject', (data) => {
      io.to(data.targetUserId).emit('consultation_call_reject', data);
    });

    socket.on('consultation_call_signal', (data) => {
      io.to(data.targetUserId).emit('consultation_call_signal', data);
    });

    socket.on('consultation_call_end', (data) => {
      io.to(data.targetUserId).emit('consultation_call_end', data);
    });

    socket.on('disconnect', () => {
      if (isVerboseLogging) {
        console.log('User disconnected:', socket.id);
      }
    });
  });
}

app.use(helmet());

app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);

app.use(
  morgan(isVerboseLogging ? 'dev' : 'tiny', {
    skip: (req, res) => {
      if (isVerboseLogging) {
        return false;
      }

      return res.statusCode < 400 && req.path !== '/health';
    },
  })
);
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'MediLite server is live',
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'MediLite API is running',
  });
});

app.use(async (req, res, next) => {
  if (isVercel) {
    try {
      await connectMongo();
    } catch (error) {
      console.error('Vercel DB Connection Error:', error);
      return res.status(500).json({ error: 'Database connection failed on serverless' });
    }
  }
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/symptoms', symptomRoutes);

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
app.use('/api/consultations', consultationRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/stock', stockRoutes);

app.use((req, res) => {
  console.warn('404:', req.method, req.url);
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('ERROR:', err.stack);
  res.status(500).json({
    error: err.message || 'Something went wrong',
  });
});

connectMongo()
  .then(async () => {
    await ensureAdminUser();
    startReminderScheduler();
    console.log('MongoDB connected');

    if (!isVercel) {
      httpServer.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    }
  })
  .catch((error) => {
    console.error('MongoDB connection failed:', error);

    if (!isVercel) {
      process.exit(1);
    }
  });

process.on('SIGTERM', async () => {
  await mongoose.disconnect();
  process.exit(0);
});

export default app;
