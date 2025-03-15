import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { mocked } from 'jest-mock';

import * as authController from '../../../src/controllers/auth';
import { User } from '../../../src/models';
import { generateJWT } from '../../../src/utils/jwtHandler';
import { AppError } from '../../../src/utils/error';

import { type AuthenticatedRequest } from '../../types/AuthenticatedRequest';

jest.mock('../../../src/models', () => ({
  User: {
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('../../../src/utils/jwtHandler', () => ({
  generateJWT: jest.fn(),
}));

describe('Auth Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('signupUsingEmailAndPassword', () => {
    beforeEach(() => {
      mockRequest.body = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'P@ssword123',
      };
    });

    it('should create a new user and return a token when user does not exist', async () => {
      const mockUserId = new mongoose.Types.ObjectId();
      const mockUser = {
        _id: mockUserId,
        name: 'Test User',
        email: 'test@example.com',
      };
      const mockToken = { token: 'test-token', expiresIn: '30d' };

      // Mock User.findOne to return null (user doesn't exist)
      mocked(User.findOne).mockResolvedValueOnce(null);

      // Mock User.create to return new user
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mocked(User.create).mockResolvedValueOnce(mockUser as any);

      // Mock generateJWT to return token
      mocked(generateJWT).mockReturnValueOnce(mockToken);

      await authController.signupUsingEmailAndPassword(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(User.create).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'P@ssword123',
      });
      expect(generateJWT).toHaveBeenCalledWith(
        mockUserId,
        'Test User',
        'test@example.com'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: { user: mockUser, tokenData: mockToken },
      });
    });

    it('should return error when user already exists', async () => {
      // Mock User.findOne to return existing user
      mocked(User.findOne).mockResolvedValueOnce({
        email: 'test@example.com',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      // Call the controller
      await authController.signupUsingEmailAndPassword(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assertions
      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(User.create).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User already exists',
          statusCode: 400,
        })
      );
    });
  });

  describe('loginUsingEmailAndPassword', () => {
    beforeEach(() => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'P@ssword123',
      };
    });

    it('should login user and return token when credentials are valid', async () => {
      // Setup mocks
      const mockUserId = new mongoose.Types.ObjectId();
      const mockUser = {
        _id: mockUserId,
        name: 'Test User',
        email: 'test@example.com',
        comparePassword: jest.fn().mockResolvedValueOnce(true),
      };
      const mockToken = { token: 'test-token', expiresIn: '30d' };

      // Mock User.findOne to return user
      mocked(User.findOne).mockImplementationOnce(() => {
        return {
          select: jest.fn().mockResolvedValueOnce(mockUser),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;
      });

      // Mock generateJWT to return token
      mocked(generateJWT).mockReturnValueOnce(mockToken);

      // Call the controller
      await authController.loginUsingEmailAndPassword(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assertions
      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(mockUser.comparePassword).toHaveBeenCalledWith('P@ssword123');
      expect(generateJWT).toHaveBeenCalledWith(
        mockUserId,
        'Test User',
        'test@example.com'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: { user: mockUser, tokenData: mockToken },
      });
    });

    it('should return error when user does not exist', async () => {
      // Mock User.findOne to return null (user doesn't exist)
      mocked(User.findOne).mockImplementationOnce(() => {
        return {
          select: jest.fn().mockResolvedValueOnce(null),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;
      });

      // Call the controller
      await authController.loginUsingEmailAndPassword(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assertions
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User with this email does not exist',
          statusCode: 404,
        })
      );
    });

    it('should return error when password is invalid', async () => {
      // Setup mock user with invalid password
      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        email: 'test@example.com',
        comparePassword: jest.fn().mockResolvedValueOnce(false),
      };

      // Mock User.findOne to return user
      mocked(User.findOne).mockImplementationOnce(() => {
        return {
          select: jest.fn().mockResolvedValueOnce(mockUser),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;
      });

      // Call the controller
      await authController.loginUsingEmailAndPassword(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assertions
      expect(mockUser.comparePassword).toHaveBeenCalledWith('P@ssword123');
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid password',
          statusCode: 401,
        })
      );
    });
  });

  describe('signupUsingPhoneAndPassword', () => {
    beforeEach(() => {
      mockRequest.body = {
        name: 'Test User',
        phone: '+911234567890',
        password: 'P@ssword123',
      };
    });

    it('should create a new user and return a token when user does not exist', async () => {
      const mockId = new mongoose.Types.ObjectId();
      const mockUser = {
        _id: mockId,
        name: 'Test User',
        phone: '+911234567890',
      };
      const mockToken = { token: 'test-token', expiresIn: '30d' };

      // Mock User.findOne to return null (user doesn't exist)
      mocked(User.findOne).mockResolvedValueOnce(null);

      // Mock User.create to return new user
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mocked(User.create).mockResolvedValueOnce(mockUser as any);

      // Mock generateJWT to return token
      mocked(generateJWT).mockReturnValueOnce(mockToken);

      await authController.signupUsingPhoneAndPassword(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(User.findOne).toHaveBeenCalledWith({ phone: '+911234567890' });
      expect(User.create).toHaveBeenCalledWith({
        name: 'Test User',
        phone: '+911234567890',
        password: 'P@ssword123',
      });
      expect(generateJWT).toHaveBeenCalledWith(
        mockId,
        'Test User',
        '+911234567890'
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: { user: mockUser, tokenData: mockToken },
      });
    });

    it('should return error when user already exists', async () => {
      // Mock User.findOne to return existing user
      mocked(User.findOne).mockResolvedValueOnce({
        phone: '+911234567890',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      // Call the controller
      await authController.signupUsingPhoneAndPassword(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assertions
      expect(User.findOne).toHaveBeenCalledWith({ phone: '+911234567890' });
      expect(User.create).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User already exists',
          statusCode: 400,
        })
      );
    });
  });

  describe('loginUsingPhoneAndPassword', () => {
    beforeEach(() => {
      mockRequest.body = {
        phone: '+911234567890',
        password: 'P@ssword123',
      };
    });

    it('should login user and return token when credentials are valid', async () => {
      // Setup mocks
      const mockUserId = new mongoose.Types.ObjectId();
      const mockUser = {
        _id: mockUserId,
        name: 'Test User',
        phone: '+911234567890',
        comparePassword: jest.fn().mockResolvedValueOnce(true),
      };
      const mockToken = { token: 'test-token', expiresIn: '30d' };

      // Mock User.findOne to return user
      mocked(User.findOne).mockImplementationOnce(() => {
        return {
          select: jest.fn().mockResolvedValueOnce(mockUser),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;
      });

      // Mock generateJWT to return token
      mocked(generateJWT).mockReturnValueOnce(mockToken);

      // Call the controller
      await authController.loginUsingPhoneAndPassword(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assertions
      expect(User.findOne).toHaveBeenCalledWith({ phone: '+911234567890' });
      expect(mockUser.comparePassword).toHaveBeenCalledWith('P@ssword123');
      expect(generateJWT).toHaveBeenCalledWith(
        mockUserId,
        'Test User',
        '+911234567890'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: { user: mockUser, tokenData: mockToken },
      });
    });

    it('should return error when user does not exist', async () => {
      // Mock User.findOne to return null (user doesn't exist)
      mocked(User.findOne).mockImplementationOnce(() => {
        return {
          select: jest.fn().mockResolvedValueOnce(null),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;
      });

      // Call the controller
      await authController.loginUsingPhoneAndPassword(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assertions
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User with this phone number does not exist',
          statusCode: 404,
        })
      );
    });

    it('should return error when password is invalid', async () => {
      // Setup mock user with invalid password
      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        phone: '+911234567890',
        comparePassword: jest.fn().mockResolvedValueOnce(false),
      };

      // Mock User.findOne to return user
      mocked(User.findOne).mockImplementationOnce(() => {
        return {
          select: jest.fn().mockResolvedValueOnce(mockUser),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;
      });

      // Call the controller
      await authController.loginUsingPhoneAndPassword(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assertions
      expect(mockUser.comparePassword).toHaveBeenCalledWith('P@ssword123');
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid password',
          statusCode: 401,
        })
      );
    });
  });

  describe('getUserData', () => {
    it('should return user data when authenticated', async () => {
      // Setup authenticated request with user ID
      const mockUserId = new mongoose.Types.ObjectId();
      const mockAuthRequest: Partial<AuthenticatedRequest> = {
        _id: mockUserId.toString(),
      };

      // Setup mock user
      const mockUser = {
        _id: mockUserId,
        name: 'Test User',
        email: 'test@example.com',
      };

      // Mock User.findById to return user
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mocked(User.findById).mockResolvedValueOnce(mockUser as any);

      // Call the controller
      await authController.getUserData(
        mockAuthRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assertions
      expect(User.findById).toHaveBeenCalledWith(mockUserId.toString());
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: { user: mockUser },
      });
    });

    it('should return error when user is not found', async () => {
      // Setup authenticated request with user ID
      const mockUserId = new mongoose.Types.ObjectId();
      const mockAuthRequest: Partial<AuthenticatedRequest> = {
        _id: mockUserId.toString(),
      };

      // Mock User.findById to return null (user not found)
      mocked(User.findById).mockResolvedValueOnce(null);

      // Call the controller
      await authController.getUserData(
        mockAuthRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assertions
      expect(User.findById).toHaveBeenCalledWith(mockUserId.toString());
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User not found',
          statusCode: 404,
        })
      );
    });
  });
});
