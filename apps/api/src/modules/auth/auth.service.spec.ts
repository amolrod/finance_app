import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import * as argon2 from 'argon2';

import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';

// Mock argon2
jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  verify: jest.fn().mockResolvedValue(true),
  argon2id: 2,
}));

describe('AuthService', () => {
  let authService: AuthService;
  let prismaService: DeepMockProxy<PrismaService>;
  let jwtService: DeepMockProxy<JwtService>;
  let emailService: DeepMockProxy<EmailService>;
  let configService: DeepMockProxy<ConfigService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: 'hashed_password',
    firstName: 'John',
    lastName: 'Doe',
    isActive: true,
    emailVerified: false,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaService>(),
        },
        {
          provide: EmailService,
          useValue: mockDeep<EmailService>(),
        },
        {
          provide: JwtService,
          useValue: mockDeep<JwtService>(),
        },
        {
          provide: ConfigService,
          useValue: mockDeep<ConfigService>(),
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService);
    jwtService = module.get(JwtService);
    emailService = module.get(EmailService);
    configService = module.get(ConfigService);

    // Reset mocks
    jest.clearAllMocks();

    // Default config values
    configService.get.mockImplementation((key: string) => {
      const config: Record<string, string> = {
        JWT_SECRET: 'test-secret',
        JWT_EXPIRES_IN: '15m',
        JWT_REFRESH_SECRET: 'test-refresh-secret',
        JWT_REFRESH_EXPIRES_IN: '7d',
        FRONTEND_URL: 'http://localhost:3000',
      };
      return config[key];
    });

    // Default JWT sign
    jwtService.sign.mockReturnValue('mock-jwt-token');
  });

  describe('register', () => {
    const registerDto = {
      email: 'new@example.com',
      password: 'Password123!',
      firstName: 'Jane',
      lastName: 'Doe',
    };

    it('should register a new user successfully', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);
      prismaService.user.create.mockResolvedValue({
        ...mockUser,
        id: 'new-user-id',
        email: registerDto.email.toLowerCase(),
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
      });
      prismaService.refreshToken.create.mockResolvedValue({
        id: 'token-id',
        token: 'refresh-token',
        userId: 'new-user-id',
        expiresAt: new Date(),
        revokedAt: null,
        createdAt: new Date(),
      });
      prismaService.category.createMany.mockResolvedValue({ count: 10 });

      const result = await authService.register(registerDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(registerDto.email.toLowerCase());
      expect(prismaService.user.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(authService.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should hash password with argon2', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);
      prismaService.user.create.mockResolvedValue(mockUser);
      prismaService.refreshToken.create.mockResolvedValue({
        id: 'token-id',
        token: 'refresh-token',
        userId: mockUser.id,
        expiresAt: new Date(),
        revokedAt: null,
        createdAt: new Date(),
      });
      prismaService.category.createMany.mockResolvedValue({ count: 10 });

      await authService.register(registerDto);

      expect(argon2.hash).toHaveBeenCalledWith(registerDto.password, expect.any(Object));
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    it('should login successfully with valid credentials', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.refreshToken.create.mockResolvedValue({
        id: 'token-id',
        token: 'refresh-token',
        userId: mockUser.id,
        expiresAt: new Date(),
        revokedAt: null,
        createdAt: new Date(),
      });
      prismaService.auditLog.create.mockResolvedValue({} as any);
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      const result = await authService.login(loginDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(mockUser.email);
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for deactivated account', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for deleted user', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        deletedAt: new Date(),
      });

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshTokens', () => {
    const validRefreshToken = 'valid-refresh-token';

    it('should refresh tokens successfully', async () => {
      const storedToken = {
        id: 'token-id',
        token: validRefreshToken,
        userId: mockUser.id,
        expiresAt: new Date(Date.now() + 1000000),
        revokedAt: null,
        createdAt: new Date(),
        user: mockUser,
      };

      prismaService.refreshToken.findUnique.mockResolvedValue(storedToken as any);
      prismaService.refreshToken.update.mockResolvedValue({
        ...storedToken,
        revokedAt: new Date(),
      } as any);
      prismaService.refreshToken.create.mockResolvedValue({
        id: 'new-token-id',
        token: 'new-refresh-token',
        userId: mockUser.id,
        expiresAt: new Date(),
        revokedAt: null,
        createdAt: new Date(),
      });

      const result = await authService.refreshTokens(validRefreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(prismaService.refreshToken.update).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      prismaService.refreshToken.findUnique.mockResolvedValue(null);

      await expect(authService.refreshTokens('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for revoked token', async () => {
      prismaService.refreshToken.findUnique.mockResolvedValue({
        id: 'token-id',
        token: validRefreshToken,
        userId: mockUser.id,
        expiresAt: new Date(Date.now() + 1000000),
        revokedAt: new Date(),
        createdAt: new Date(),
        user: mockUser,
      } as any);

      await expect(authService.refreshTokens(validRefreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for expired token', async () => {
      prismaService.refreshToken.findUnique.mockResolvedValue({
        id: 'token-id',
        token: validRefreshToken,
        userId: mockUser.id,
        expiresAt: new Date(Date.now() - 1000000), // Expired
        revokedAt: null,
        createdAt: new Date(),
        user: mockUser,
      } as any);

      await expect(authService.refreshTokens(validRefreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should revoke specific refresh token', async () => {
      prismaService.refreshToken.updateMany.mockResolvedValue({ count: 1 });
      prismaService.auditLog.create.mockResolvedValue({} as any);

      await authService.logout(mockUser.id, 'specific-token');

      expect(prismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          userId: mockUser.id,
          token: 'specific-token',
          revokedAt: null,
        },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('should revoke all user tokens when no token specified', async () => {
      prismaService.refreshToken.updateMany.mockResolvedValue({ count: 3 });
      prismaService.auditLog.create.mockResolvedValue({} as any);

      await authService.logout(mockUser.id);

      expect(prismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: {
          userId: mockUser.id,
          revokedAt: null,
        },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await authService.getProfile(mockUser.id);

      expect(result).toHaveProperty('id', mockUser.id);
      expect(result).toHaveProperty('email', mockUser.email);
      expect(result).toHaveProperty('firstName');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(authService.getProfile('non-existent-id')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
