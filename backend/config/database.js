import mongoose from 'mongoose';

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI;
  
  if (!mongoURI) {
    throw new Error('MONGODB_URI environment variable is required');
  }
  
  // Set connection options
  const options = {
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
  };

  try {
    const conn = await mongoose.connect(mongoURI, options);
    // MongoDB connected successfully
    return true;
  } catch (error) {
    // MongoDB connection failed - error handling in middleware
    return false;
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  // MongoDB connected
});

mongoose.connection.on('error', () => {
  // MongoDB connection error - handled by middleware
});

mongoose.connection.on('disconnected', () => {
  // MongoDB disconnected
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

export default connectDB;

