import { CryptoService } from '@/modules/crypto/crypto.service';
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
export class AuthenticatedGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly crypto: CryptoService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();

    if (!req.headers.authorization) {
      throw new BadRequestException('Authorization token is not provided');
    }
    if (!req.headers.authorization.startsWith('Bearer')) {
      throw new UnauthorizedException('User is not authenticated');
    }

    const authToken = this.crypto.decrypt(
      req.headers.authorization.split(' ')[1],
    );
    try {
      this.jwt.verify(authToken);
    } catch (err) {
      if (err instanceof JsonWebTokenError) {
        throw new UnauthorizedException(err.message);
      }
    }

    return true;
  }
}
