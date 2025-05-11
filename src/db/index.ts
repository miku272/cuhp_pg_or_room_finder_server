/**
 * @fileoverview MongoDB database connection handler for CUHP PG or Room Finder application
 *
 * This module establishes and manages the MongoDB database connection using Mongoose ODM.
 * It handles connection events, error handling, and provides a centralized database
 * connection instance that can be used throughout the application.
 *
 * The database URL is loaded from environment variables, ensuring configuration
 * flexibility across different deployment environments.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Get database connection string from environment variables
const MONGODB_URI: string | undefined = process.env.DATABASE_URL;

/**
 * Establishes a connection to the MongoDB database
 *
 * This function attempts to connect to the database using the provided connection
 * string from environment variables. It includes error handling for invalid or
 * missing connection strings, and sets up event listeners for connection status.
 *
 * @returns {Promise<void>} A promise that resolves when the connection is established
 * @throws {Error} If the database URL is missing or invalid
 */
export const connectDB = async (): Promise<void> => {
  try {
    // Validate that the connection string exists and is not empty
    if (MONGODB_URI === undefined || MONGODB_URI.trim() === '') {
      throw new Error('No database URL');
    }

    // Attempt to connect to the database
    await mongoose.connect(MONGODB_URI);

    // Log successful initial connection
    console.log('Database connected');
  } catch (error) {
    // Log connection errors and terminate the application
    console.error(error);

    // Exit with error code 1 to indicate failure
    process.exit(1);
  }

  // Set up event listeners to monitor connection status

  // 'connected' event fires when Mongoose successfully connects to MongoDB
  mongoose.connection.on('connected', () => {
    console.log('Database connected');
  });

  // 'error' event fires when errors occur after initial connection
  mongoose.connection.on('error', (error) => {
    console.error(error);
  });

  // 'disconnected' event fires when Mongoose loses connection to MongoDB
  mongoose.connection.on('disconnected', () => {
    console.log('Database disconnected');
  });
};

// Export the mongoose connection for direct access in other modules
export default mongoose.connection;
