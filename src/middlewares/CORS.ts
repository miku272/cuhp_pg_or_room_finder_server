/**
 * @fileoverview CORS configuration for HTTP and Socket.IO connections
 *
 * This module provides Cross-Origin Resource Sharing (CORS) configuration for both
 * Express HTTP requests and Socket.IO connections in the CUHP PG or Room Finder application.
 *
 * The middleware allows cross-origin requests from any domain while maintaining security
 * by controlling which HTTP methods and headers are permitted. This is particularly important
 * for enabling frontend applications hosted on different domains to interact with our API
 * and establish WebSocket connections for real-time features.
 */
import { Request, Response, NextFunction } from 'express';

/**
 * Express middleware for handling CORS (Cross-Origin Resource Sharing)
 *
 * Sets appropriate HTTP headers to allow cross-origin requests from any domain,
 * with support for common HTTP methods and authorization headers.
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function to pass control to the next middleware
 */
export const CORS = (req: Request, res: Response, next: NextFunction): void => {
  // Allow requests from any origin (*)
  res.setHeader('Access-Control-Allow-Origin', '*');
  // Allow common HTTP methods used by the application
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, PATCH, OPTIONS'
  );
  // Allow necessary headers for authentication and content negotiation
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  // Allow credentials like cookies to be included in cross-origin requests
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight requests (OPTIONS method) immediately
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
};

/**
 * Socket.IO CORS configuration object
 *
 * Defines CORS settings specifically for Socket.IO connections,
 * ensuring proper real-time communication between the client and server.
 * These settings are used when initializing the Socket.IO server in index.ts.
 */
export const socketCORS = {
  origin: '*', // Allow connections from any origin
  methods: ['GET', 'POST'], // Allow only necessary methods for Socket.IO
  allowedHeaders: ['Content-Type', 'Authorization'], // Required headers for authentication
  credentials: true, // Allow credentials in requests
  preflightContinue: false, // Don't pass preflight requests to handlers
  optionsSuccessStatus: 204, // Return 204 No Content for OPTIONS requests
};
