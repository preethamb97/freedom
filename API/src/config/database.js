import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// MongoDB connection configuration
const mongoOptions = {
  retryWrites: true,
  w: 'majority',
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4
};

// Test database connection
const testConnection = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, mongoOptions);
    console.log('[DATABASE] MongoDB Atlas connection established successfully.');
    return true;
  } catch (error) {
    console.error('[DATABASE] Unable to connect to MongoDB Atlas:', error.message);
    return false;
  }
};

// Initialize database connection
const initDatabase = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI, mongoOptions);
    }
    
    // Import models to register them
    await import('../models/index.js');
    
    console.log('[DATABASE] MongoDB models registered successfully.');
    console.log('[DATABASE] Database:', process.env.DB_NAME || 'encrypted_data_app');
    
    return true;
  } catch (error) {
    console.error('[DATABASE] Model registration failed:', error.message);
    return false;
  }
};

// Graceful shutdown
const closeConnection = async () => {
  try {
    await mongoose.connection.close();
    console.log('[DATABASE] MongoDB connection closed successfully.');
  } catch (error) {
    console.error('[DATABASE] Error closing MongoDB connection:', error.message);
  }
};

// Connection event listeners
mongoose.connection.on('connected', () => {
  console.log('[DATABASE] MongoDB connected to', process.env.DB_NAME || 'encrypted_data_app');
});

mongoose.connection.on('error', (error) => {
  console.error('[DATABASE] MongoDB connection error:', error);
});

mongoose.connection.on('disconnected', () => {
  console.log('[DATABASE] MongoDB disconnected');
});

export default mongoose;
export { testConnection, initDatabase, closeConnection }; 