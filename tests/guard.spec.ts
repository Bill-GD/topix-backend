import { AuthenticatedGuard, UserVerifiedGuard } from '@/common/guards';
import { DBType } from '@/common/utils/types';
import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

describe('Guards', () => {
  describe('Auth guard', () => {
    const mockJwtService = (type: 'refresh' | 'access') => ({
      verify: jest.fn((token: string) => ({ sub: 1, role: 'user', type })),
    });
    const mockContext = (token?: string) => ({
      switchToHttp: () => ({
        getRequest: () => ({ headers: { authorization: token } }),
      }),
    });

    it('should throw 400 if no token provided', () => {
      const guardMock = new AuthenticatedGuard(
        mockJwtService('access') as unknown as JwtService,
      );
      expect(() =>
        guardMock.canActivate(mockContext() as ExecutionContext),
      ).toThrow(BadRequestException);
    });

    it('should throw 401 if token is invalid', () => {
      const guardMock = new AuthenticatedGuard(
        mockJwtService('refresh') as unknown as JwtService,
      );
      expect(() =>
        guardMock.canActivate(
          mockContext('Bearer mocktokenstring') as ExecutionContext,
        ),
      ).toThrow(UnauthorizedException);
    });

    it(`should return true if token is valid`, () => {
      const guardMock = new AuthenticatedGuard(
        mockJwtService('access') as unknown as JwtService,
      );
      expect(
        guardMock.canActivate(
          mockContext('Bearer mocktokenstring') as ExecutionContext,
        ),
      ).toBe(true);
    });
  });

  describe('Verified user guard', () => {
    const mockDB = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn(),
    };
    const guardMock = new UserVerifiedGuard(mockDB as unknown as DBType);
    const mockContext = (userId: number) => ({
      switchToHttp: () => ({
        getRequest: () => ({ params: { id: userId } }),
      }),
    });

    it(`should return 403 if user is already verified`, async () => {
      mockDB.where.mockResolvedValue([{ id: 1, verified: true }]);
      await expect(
        guardMock.canActivate(mockContext(1) as ExecutionContext),
      ).rejects.toThrow(ForbiddenException);
    });

    it(`should return true if user isn't verified`, async () => {
      mockDB.where.mockResolvedValue([{ id: 1, verified: false }]);
      await expect(
        guardMock.canActivate(mockContext(1) as ExecutionContext),
      ).resolves.toBe(true);
    });
  });
});
