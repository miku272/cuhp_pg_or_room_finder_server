import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import * as authMiddleware from '../../../src/middlewares/auth';
import { AppError } from '../../../src/utils/error';
import * as jwtHandler from '../../../src/utils/jwtHandler';
import { User } from '../../../src/models';
import { AuthenticatedRequest } from '../../../src/types/AuthenticatedRequest';

jest.mock('express-validator', () => ({
  validationResult: jest.fn(),
  body: jest.fn().mockImplementation(() => ({
    trim: jest.fn().mockReturnThis(),
    notEmpty: jest.fn().mockReturnThis(),
    withMessage: jest.fn().mockReturnThis(),
    isLength: jest.fn().mockReturnThis(),
    isEmail: jest.fn().mockReturnThis(),
    matches: jest.fn().mockReturnThis(),
    isMobilePhone: jest.fn().mockReturnThis(),
  })),
}));

jest.mock('../../../src/utils/jwtHandler', () => ({
  verifyJWT: jest.fn(),
}));

jest.mock('../../../src/models', () => ({
  User: {
    findById: jest.fn(),
  },
}));

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {};
    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('Validation Middleware', () => {
    it('should call next() when validation passes', () => {
      // Mock validation result to pass
      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => true,
      });

      authMiddleware.validateSignupUsingEmailAndPasswordRequest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next with error when validation fails', () => {
      // Mock validation errors
      const mockErrors = [{ param: 'email', msg: 'Email is invalid' }];

      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => false,
        array: () => mockErrors,
      });

      authMiddleware.validateSignupUsingEmailAndPasswordRequest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledTimes(1);

      // Update this expectation to properly check error properties
      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Validation failed');
      expect(error.statusCode).toBe(422);
      expect(error.validationErrors).toEqual(mockErrors);
    });
  });

  describe('tokenAuth', () => {
    const mockToken = 'valid-token';
    const mockUserId = new mongoose.Types.ObjectId();

    beforeEach(() => {
      mockRequest = {
        header: jest.fn().mockReturnValue(`Bearer ${mockToken}`),
      };
    });

    it('should authenticate valid token and set user data on request', async () => {
      const mockUser = { _id: mockUserId };

      // Mock JWT verification
      (jwtHandler.verifyJWT as jest.Mock).mockReturnValue({ _id: mockUserId });

      // Mock user retrieval
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      await authMiddleware.tokenAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.header).toHaveBeenCalledWith('Authorization');
      expect(jwtHandler.verifyJWT).toHaveBeenCalledWith(mockToken);
      expect(User.findById).toHaveBeenCalledWith(mockUserId);
      expect((mockRequest as AuthenticatedRequest).token).toBe(mockToken);
      expect((mockRequest as AuthenticatedRequest)._id).toBe(mockUserId);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should return error when no token is provided', async () => {
      mockRequest.header = jest.fn().mockReturnValue(undefined);

      await authMiddleware.tokenAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('No authorization token. Access denied!');
      expect(error.statusCode).toBe(401);
    });

    it('should return error when user is not found', async () => {
      // Mock JWT verification
      (jwtHandler.verifyJWT as jest.Mock).mockReturnValue({ _id: mockUserId });

      // Mock user not found
      (User.findById as jest.Mock).mockResolvedValue(null);

      await authMiddleware.tokenAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
    });

    it('should pass any thrown errors to next', async () => {
      const mockError = new Error('JWT verification failed');

      // Mock JWT verification to throw
      (jwtHandler.verifyJWT as jest.Mock).mockImplementation(() => {
        throw mockError;
      });

      await authMiddleware.tokenAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe('Email and Phone Validation Middleware', () => {
    it('should call next() when email login validation passes', () => {
      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => true,
      });

      authMiddleware.validateLoginUsingEmailAndPasswordRequest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next() when phone signup validation passes', () => {
      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => true,
      });

      authMiddleware.validateSignupUsingPhoneAndPasswordRequest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next() when phone login validation passes', () => {
      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => true,
      });

      authMiddleware.validateLoginUsingPhoneAndPasswordRequest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next with error when email login validation fails', () => {
      const mockErrors = [{ param: 'email', msg: 'Email is required' }];
      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => false,
        array: () => mockErrors,
      });

      authMiddleware.validateLoginUsingEmailAndPasswordRequest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Validation failed');
      expect(error.statusCode).toBe(422);
      expect(error.validationErrors).toEqual(mockErrors);
    });

    it('should call next with error when phone signup validation fails', () => {
      const mockErrors = [{ param: 'phone', msg: 'Phone is invalid' }];
      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => false,
        array: () => mockErrors,
      });

      authMiddleware.validateSignupUsingPhoneAndPasswordRequest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Validation failed');
      expect(error.statusCode).toBe(422);
      expect(error.validationErrors).toEqual(mockErrors);
    });

    it('should call next with error when phone login validation fails', () => {
      const mockErrors = [{ param: 'phone', msg: 'Phone is invalid' }];
      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: () => false,
        array: () => mockErrors,
      });

      authMiddleware.validateLoginUsingPhoneAndPasswordRequest(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      const error = mockNext.mock.calls[0][0];
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Validation failed');
      expect(error.statusCode).toBe(422);
      expect(error.validationErrors).toEqual(mockErrors);
    });
  });
});
