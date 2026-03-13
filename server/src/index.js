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
import { startReminderService } from './services/reminderService.js';
import { startInventoryService } from './services/inventoryService.js';
import { authMiddleware } from './middleware/authMiddleware.js';


import { createServer } from 'http';
import { Server } from 'socket.io';

const prisma = new PrismaClient();
const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
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

// Start Background Services
startReminderService();
startInventoryService();
const PORT = process.env.PORT || 5000;

// Socket.io Connection Logic
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_room', (data) => {
    // data.room is unique for each patient-doctor/admin pair
    socket.join(data.room);
    console.log(`User ${socket.id} joined room ${data.room}`);
  });

  socket.on('send_message', (data) => {
    // Broadcast to the specific room
    io.to(data.room).emit('receive_message', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [process.env.FRONTEND_URL || 'http://localhost:5173'];
    const isLocalhost = origin.startsWith('http://localhost:');
    
    if (allowedOrigins.indexOf(origin) !== -1 || isLocalhost) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Provide io instance to routes if needed
app.set('io', io);

app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Protected Routes
app.use(authMiddleware);
app.use('/api/records', recordRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/chat', chatRoutes);


// Basic Route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'MediLite API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
