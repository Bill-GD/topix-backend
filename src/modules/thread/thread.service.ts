import { DatabaseProviderKey } from '@/common/utils/constants';
import { DBType } from '@/common/utils/types';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class ThreadService {
  constructor(@Inject(DatabaseProviderKey) private readonly db: DBType) {}

  getAll() {
    return `This action returns all thread`;
  }

  // getOne(id: number) {
  //   return `This action returns a #${id} thread`;
  // }
  //
  // create(createThreadDto: CreateThreadDto) {
  //   return 'This action adds a new thread';
  // }
  //
  // update(id: number, updateThreadDto: UpdateThreadDto) {
  //   return `This action updates a #${id} thread`;
  // }
  //
  // remove(id: number) {
  //   return `This action removes a #${id} thread`;
  // }
}
