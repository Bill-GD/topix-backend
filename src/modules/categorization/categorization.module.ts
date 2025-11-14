import { CategorizationService } from '@/modules/categorization/categorization.service';
import { Global, Module } from '@nestjs/common';

@Global()
@Module({
  providers: [CategorizationService],
  exports: [CategorizationService],
})
export class CategorizationModule {}
