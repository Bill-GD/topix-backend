import { CryptoService } from '@/modules/crypto/crypto.service';
import { Global, Module } from '@nestjs/common';

@Global()
@Module({
  providers: [CryptoService],
  exports: [CryptoService],
})
export class CryptoModule {}
