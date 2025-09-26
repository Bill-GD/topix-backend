import { DatabaseProviderKey } from '@/common/utils/constants';
import { Result } from '@/common/utils/result';
import { DBType } from '@/common/utils/types';
import { groupTable } from '@/database/schemas';
import { FileService } from '@/modules/file/file.service';
import { ThreadService } from '@/modules/thread/thread.service';
import { Inject, Injectable } from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupService {
  constructor(
    @Inject(DatabaseProviderKey) private readonly db: DBType,
    private readonly threadService: ThreadService,
    private readonly fileService: FileService,
  ) {}

  async create(dto: CreateGroupDto, requesterId: number) {
    let bannerUrl: string | undefined;
    if (dto.bannerFile) {
      const res = await this.fileService.uploadSingle(dto.bannerFile);
      bannerUrl = res.data;
    }

    const [{ id: groupId }] = await this.db
      .insert(groupTable)
      .values({
        ownerId: requesterId,
        name: dto.name,
        bannerPicture: bannerUrl,
      })
      .$returningId();
    return Result.ok('Created group successfully.', groupId);
  }

  findAll() {
    return `This action returns all group`;
  }

  findOne(id: number) {
    return `This action returns a #${id} group`;
  }

  update(id: number, dto: UpdateGroupDto) {
    return `This action updates a #${id} group`;
  }

  remove(id: number) {
    return `This action removes a #${id} group`;
  }
}
