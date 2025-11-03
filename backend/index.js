import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import authRoutes from './routes/auth.js';
import conversationRoutes from './routes/conversations.js';
import memoryRoutes from './routes/memories.js';
import errorHandler from './middleware/errorHandler.js';
import { checkDBConnection } from './middleware/checkDB.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Validate required environment variables
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is required in production');
  }
}

// Connect to MongoDB (non-blocking)
connectDB().catch(() => {
  // Error handling in connectDB
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes (with DB connection check)
app.use('/api/auth', checkDBConnection, authRoutes);
app.use('/api/conversations', checkDBConnection, conversationRoutes);
app.use('/api/memories', checkDBConnection, memoryRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  // Server started successfully
});

