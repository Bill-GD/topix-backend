import { JwtUserPayload } from '@/common/utils/types';
import { CryptoService } from '@/modules/crypto/crypto.service';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JsonWebTokenError, JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsAuthenticatedGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly crypto: CryptoService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient<Socket>();

    if (
      !client.handshake.auth?.token ||
      typeof client.handshake.auth?.token !== 'string'
    ) {
      throw new WsException('Authorization token is not provided.');
    }
    if (!client.handshake.auth.token.startsWith('Bearer')) {
      throw new WsException('User is not authenticated.');
    }

    const authToken = this.crypto.decrypt(
      client.handshake.auth.token.split(' ')[1],
    );

    try {
      const user = this.jwt.verify<JwtUserPayload>(authToken);

      client.data.userId = user.sub;
      client.data.userRole = user.role;
      if (user.type !== 'access') {
        throw new JsonWebTokenError('Invalid token provided.');
      }
    } catch (err) {
      if (err instanceof Error) {
        throw new WsException(err.message);
      }
    }
    return true;
  }
}
