import { CreateThreadDto } from '@/modules/thread/dto/create-thread.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateThreadDto extends PartialType(CreateThreadDto) {}
