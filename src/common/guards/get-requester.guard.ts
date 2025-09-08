import { JwtUserPayload } from '@/common/utils/types';
import { CryptoService } from '@/modules/crypto/crypto.service';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class GetRequesterGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly crypto: CryptoService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();

    const authToken = req.headers.authorization!.split(' ')[1];
    const user: JwtUserPayload = this.jwt.verify(authToken);
    req['username'] = user.username;

    return true;
  }
}
