import { GroupQuery } from '@/common/queries';
import { DatabaseProviderKey } from '@/common/utils/constants';
import { getCloudinaryIdFromUrl } from '@/common/utils/helpers';
import { Result } from '@/common/utils/result';
import { DBType } from '@/common/utils/types';
import {
  groupMemberTable,
  groupTable,
  profileTable,
  userTable,
} from '@/database/schemas';
import { FileService } from '@/modules/file/file.service';
import { CreatePostDto } from '@/modules/post/dto/create-post.dto';
import { PostService } from '@/modules/post/post.service';
import { CreateThreadDto } from '@/modules/thread/dto/create-thread.dto';
import { ThreadService } from '@/modules/thread/thread.service';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, sql, SQL } from 'drizzle-orm';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupService {
  constructor(
    @Inject(DatabaseProviderKey) private readonly db: DBType,
    private readonly threadService: ThreadService,
    private readonly postService: PostService,
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

  async addPost(groupId: number, ownerId: number, dto: CreatePostDto) {
    await this.postService.create(ownerId, dto, undefined, groupId);
    return Result.ok('Added post to group successfully.', null);
  }

  async addThread(groupId: number, ownerId: number, dto: CreateThreadDto) {
    await this.threadService.create(dto, ownerId, groupId);
    return Result.ok('Added thread to group successfully.', null);
  }

  async update(groupId: number, dto: UpdateGroupDto) {
    let bannerUrl: string | undefined;
    if (dto.bannerFile) {
      const [{ bannerPicture: oldBannerUrl }] = await this.db
        .select({ bannerPicture: groupTable.bannerPicture })
        .from(groupTable)
        .where(eq(groupTable.id, groupId));
      if (oldBannerUrl) {
        const publicId = getCloudinaryIdFromUrl(oldBannerUrl);
        this.fileService.removeSingle(publicId, 'image');
      }
      bannerUrl = (await this.fileService.uploadSingle(dto.bannerFile)).data;
    }

    await this.db
      .update(groupTable)
      .set({
        name: dto.name,
        bannerPicture: bannerUrl,
        description: dto.description,
      })
      .where(eq(groupTable.id, groupId));
    return Result.ok('Updated group successfully.', null);
  }

  async remove(groupId: number) {
    return Result.ok('Deleted group successfully.', null);
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
        joined: sql<boolean>`(if(${groupMemberTable.userId} = ${requesterId}, true, false))`,
        dateJoined: sql<Date | null>`(if(${groupMemberTable.userId} = ${requesterId}, ${groupMemberTable.dateJoined}, null))`,
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
