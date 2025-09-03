import { DatabaseProviderKey } from '@/common/utils/constants';
import { DBType } from '@/common/utils/types';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(@Inject(DatabaseProviderKey) private readonly db: DBType) {}

  create(createAuthDto: CreateAuthDto) {
    return 'This action adds a new auth';
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
