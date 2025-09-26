import { JwtUserPayload } from '@/common/utils/types';
import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JsonWebTokenError, JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();

    if (!req.headers.authorization) {
      throw new BadRequestException('Authorization token is not provided.');
    }
    if (!req.headers.authorization.startsWith('Bearer')) {
      throw new UnauthorizedException('User is not authenticated.');
    }

    const authToken = req.headers.authorization.split(' ')[1];
    try {
      const token = this.jwt.verify<JwtUserPayload>(authToken);
      if (token.type !== 'refresh') {
        throw new JsonWebTokenError('Invalid token provided.');
      }
    } catch (err) {
      if (err instanceof JsonWebTokenError) {
        throw new UnauthorizedException(err.message);
      }
    }

    return true;
  }
}
