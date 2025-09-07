import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JsonWebTokenError, JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import * as process from 'node:process';

@Injectable()
export class AuthenticatedGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();

    if (!req.headers.authorization?.startsWith('Bearer')) {
      throw new UnauthorizedException('User is not authenticated');
    }

    const authToken = req.headers.authorization.split(' ')[1];
    try {
      this.jwt.verify(authToken, { secret: `${process.env.JWT_SECRET}` });
    } catch (err) {
      if (err instanceof JsonWebTokenError) {
        throw new UnauthorizedException(err.message);
      }
    }

    return true;
  }
}
