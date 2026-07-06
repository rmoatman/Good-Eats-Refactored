// MongoDB connection helper. Wraps mongoose.connect and wires up connection
// event logging so the rest of the app just awaits connectDB() at startup.
import mongoose from 'mongoose';

// Connect to MongoDB Atlas. The URI comes from the MONGODB_URI env var.
export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set. Add it to server/.env.');
  }

  // Register connection listeners BEFORE connecting so we don't miss the initial
  // 'connected' event. The 'error' listener also catches errors that happen
  // AFTER the initial connect (e.g. Atlas dropping the connection at runtime),
  // which the awaited connect() promise below would not surface.
  mongoose.connection.on('connected', () => console.log('MongoDB connected'));
  mongoose.connection.on('error', (err) => console.error('MongoDB error:', err.message));

  // Await so index.js only starts the HTTP server once the DB is reachable;
  // a failed connect rejects here and is handled by the caller.
  await mongoose.connect(uri);
}
