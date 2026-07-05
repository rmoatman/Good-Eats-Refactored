import mongoose from 'mongoose';

// Connect to MongoDB Atlas. The URI comes from the MONGODB_URI env var.
export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set. Add it to server/.env.');
  }

  mongoose.connection.on('connected', () => console.log('MongoDB connected'));
  mongoose.connection.on('error', (err) => console.error('MongoDB error:', err.message));

  await mongoose.connect(uri);
}
