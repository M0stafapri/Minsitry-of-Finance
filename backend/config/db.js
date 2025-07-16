const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://innovati:1923036e@innovaticluster.fxm3i6t.mongodb.net/?retryWrites=true&w=majority', {
      // Connection pool settings
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      // Server selection timeout
      serverSelectionTimeoutMS: 30000,
      // Socket timeout
      socketTimeoutMS: 45000,
      // Atlas-specific options
      retryWrites: true,
      retryReads: true,
      // Write concern for immediate consistency
      writeConcern: {
        w: 'majority',
        j: true,
        wtimeout: 10000
      },
      // Read preference for consistent reads
      readPreference: 'primary',
      readConcern: {
        level: 'majority'
      }
    });
    console.log(`🟢 Connected to MongoDB: ${conn.connection.host}`);
    
    // Set global write concern for all operations
    mongoose.set('debug', process.env.NODE_ENV === 'development');
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('🔴 MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('🟡 MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('🟢 MongoDB reconnected');
    });
    
  } catch (error) {
    console.log("🔴 MongoDB connection error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
