const mongoose = require('mongoose');

module.exports = async function connectDB() {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri || !uri.trim()) {
      throw new Error('MONGO_URI is not set. Configure it in the server environment.');
    }

    await mongoose.connect(uri);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
};
