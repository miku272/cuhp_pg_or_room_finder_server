import http from 'http';

import express from 'express';
import rateLimit from 'express-rate-limit';
import { Server as SocketIOServer } from 'socket.io';

import authRouter from './routes/auth';
import otpRouter from './routes/otp';
import propertyRouter from './routes/property';
import chatRouter from './routes/chat';
import reviewRouter from './routes/review';
import savedRouter from './routes/saved';

import { connectDB } from './db';
import { setupSocketIO } from './socket';

import { CORS, socketCORS } from './middlewares/CORS';
import { errorHandler } from './middlewares/error';
import routeNotFoundTemplate from './template/routeNotFound';

/**
 * @fileoverview Main application entry point for the CUHP PG or Room Finder API
 *
 * This file sets up an Express server with various middleware configurations,
 * registers all API routes, configures Socket.IO for real-time communications,
 * and connects to the MongoDB database.
 *
 * The application follows a modular architecture with separate route handlers,
 * controllers, middleware, and utility functions.
 */

/**
 * Application port, defaults to 8000 if not specified in environment variables
 */
const port = process.env.PORT ?? 8000;

/**
 * Express application instance
 */
const app = express();

/**
 * HTTP server instance created from the Express app
 */
const server = http.createServer(app);

/**
 * Socket.IO server instance with CORS configuration
 * Used for real-time communications like chat messages and notifications
 */
const io = new SocketIOServer(server, {
  cors: socketCORS,
});

/**
 * Rate limiter middleware to prevent abuse
 * Limits requests based on IP address and requested URL
 */
const limiter = rateLimit({
  keyGenerator: (req) => {
    return req.ip + req.originalUrl;
  },
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later',
});
app.use(limiter);

/**
 * Configure CORS middleware to allow cross-origin requests
 */
app.use(CORS);

/**
 * Configure JSON body parser middleware
 */
app.use(express.json());

/**
 * Mount authentication routes
 */
app.use('/auth', authRouter);

/**
 * Mount OTP verification routes
 */
app.use(otpRouter);

/**
 * Mount property listing routes
 */
app.use(propertyRouter);

/**
 * Mount chat functionality routes
 */
app.use('/chat', chatRouter);

/**
 * Mount property review routes
 */
app.use('/review', reviewRouter);

/**
 * Mount saved/favorite property routes
 */
app.use('/saved', savedRouter);

/**
 * Root route - health check endpoint
 */
app.get('/', (req, res) => {
  res.send('Hello World!!!');
});

/**
 * 404 handler for undefined routes
 * Returns a styled HTML page with error details
 */
app.use((req, res) => {
  const htmlContent = routeNotFoundTemplate(req.method, req.originalUrl);

  res.status(404).send(htmlContent);
});

/**
 * Global error handling middleware
 */
app.use(errorHandler);

/**
 * Configure Socket.IO for real-time communication
 */
setupSocketIO(io);

/**
 * Server startup function
 * Connects to the database and starts listening for requests
 */
const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    server.listen(port, () => {
      console.log('Server started on http://localhost:8000');
    });
  } catch (error) {
    console.error('Failed to start the server: ', error);

    process.exit(1);
  }
};

void startServer();
