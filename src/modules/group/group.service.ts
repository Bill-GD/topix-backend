import { GroupQuery } from '@/common/queries';
import { DatabaseProviderKey } from '@/common/utils/constants';
import { Result } from '@/common/utils/result';
import { DBType } from '@/common/utils/types';
import {
  groupMemberTable,
  groupTable,
  profileTable,
  userTable,
} from '@/database/schemas';
import { FileService } from '@/modules/file/file.service';
import { ThreadService } from '@/modules/thread/thread.service';
import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, sql, SQL } from 'drizzle-orm';
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

  async getAll(groupQuery: GroupQuery, requesterId: number) {
    const andQueries: SQL[] = [];

    if (groupQuery.username) {
      andQueries.push(eq(userTable.username, groupQuery.username));
    }
    if (groupQuery.name) {
      andQueries.push(eq(groupTable.name, groupQuery.name));
    }

    const groups = await this.getGroupQuery(requesterId)
      .where(and(...andQueries))
      .limit(groupQuery.limit)
      .offset(groupQuery.offset);

    return Result.ok('Fetched groups successfully.', groups);
  }

  async getOne(groupId: number, requesterId: number) {
    const [group] = await this.getGroupQuery(requesterId).where(
      eq(groupTable.id, groupId),
    );

    return Result.ok('Fetched group successfully.', group);
  }

  update(groupId: number, dto: UpdateGroupDto) {
    return `This action updates a #${groupId} group`;
  }

  remove(groupId: number) {
    return `This action removes a #${groupId} group`;
  }

  private getGroupQuery(requesterId: number) {
    return this.db
      .select({
        id: groupTable.id,
        name: groupTable.name,
        owner: {
          username: userTable.username,
          displayName: profileTable.displayName,
          profilePicture: profileTable.profilePicture,
        },
        memberCount: groupTable.memberCount,
        // if(`thread_follow`.user_id = 7, true, false) `following`,
        joined: sql`(if(${groupMemberTable.userId} = ${requesterId}, true, false))`,
        dateJoined: sql`(if(${groupMemberTable.userId} = ${requesterId}, ${groupMemberTable.dateJoined}, null))`,
        dateCreated: groupTable.dateCreated,
        dateUpdated: groupTable.dateUpdated,
      })
      .from(groupTable)
      .innerJoin(userTable, eq(userTable.id, groupTable.ownerId))
      .innerJoin(profileTable, eq(profileTable.userId, userTable.id))
      .leftJoin(groupMemberTable, eq(groupMemberTable.groupId, groupTable.id))
      .$dynamic();
  }
}
