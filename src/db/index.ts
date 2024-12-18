import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI: string | undefined = process.env.DATABASE_URL;

export const connectDB = async (): Promise<void> => {
  try {
    if (MONGODB_URI === undefined || MONGODB_URI.trim() === '') {
      throw new Error('No database URL');
    }

    await mongoose.connect(MONGODB_URI);

    console.log('Database connected');
  } catch (error) {
    console.error(error);

    process.exit(1);
  }

  mongoose.connection.on('error', (error) => {
    console.error(error);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('Database disconnected');
  });
};

export default mongoose.connection; // Used for working with connection in other files
