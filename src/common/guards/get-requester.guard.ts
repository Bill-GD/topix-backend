import { JwtUserPayload } from '@/common/utils/types';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JsonWebTokenError, JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class GetRequesterGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();

    const authToken = req.headers.authorization!.split(' ')[1];
    try {
      const user: JwtUserPayload = this.jwt.verify(authToken);
      req.userId = user.sub;
    } catch (e) {
      if (e instanceof JsonWebTokenError) {
        throw new UnauthorizedException(e.message);
      }
    }

    return true;
  }
}
