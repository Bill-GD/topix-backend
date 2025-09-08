import { CryptoService } from '@/modules/crypto/crypto.service';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class DecryptTokenMiddleware implements NestMiddleware {
  constructor(private readonly crypto: CryptoService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer')) {
      const authToken = this.crypto.decrypt(authHeader.split(' ')[1]);
      req.headers.authorization = `Bearer ${authToken}`;
    }

    next();
  }
}
