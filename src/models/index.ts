/**
 * @fileoverview Central export file for all MongoDB models used in CUHP PG or Room Finder application
 *
 * This file serves as the main entry point for importing all models throughout the application.
 * It re-exports all model interfaces and classes from their respective files, providing a cleaner
 * import experience for other application components by allowing them to import from a single location.
 *
 * The application uses MongoDB with Mongoose ODM to manage data related to users, properties,
 * reviews, saved properties, and real-time chat functionality.
 *
 * @example
 * // Import multiple models in a cleaner way
 * import { User, Property, Review } from '../models';
 *
 * // Instead of individual imports
 * // import { User } from '../models/user.model';
 * // import { Property } from '../models/property.model';
 */

// User model for authentication and profile management
export { IUser, User } from './user.model';

// Property model for PG and room listings with geographical features
export { IProperty, Property, UNIVERSITY_COORDINATES } from './property.model';

// Message model for individual chat messages
export { IMessage, Message } from './message.model';

// Chat model for conversation threads between users
export { IChat, Chat } from './chat.model';

// Review model for property ratings and feedback
export { IReview, Review } from './review.model';

// Saved model for user's bookmarked/favorite properties
export { ISaved, Saved } from './saved.model';
