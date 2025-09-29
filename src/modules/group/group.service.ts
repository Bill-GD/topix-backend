import { GroupQuery } from '@/common/queries';
import { DatabaseProviderKey } from '@/common/utils/constants';
import { getCloudinaryIdFromUrl } from '@/common/utils/helpers';
import { Result } from '@/common/utils/result';
import { DBType } from '@/common/utils/types';
import {
  groupMemberTable,
  groupTable,
  mediaTable,
  postTable,
  profileTable,
  tagTable,
  userTable,
} from '@/database/schemas';
import { FileService } from '@/modules/file/file.service';
import { CreateTagDto } from '@/modules/group/dto/create-tag.dto';
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

    await this.db.insert(groupMemberTable).values({
      groupId,
      userId: requesterId,
      accepted: true,
    });
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

  async addTag(groupId: number, dto: CreateTagDto) {
    await this.db.insert(tagTable).values({
      groupId,
      name: dto.name,
      colorHex: dto.color,
    });
    return Result.ok('Added tag to group successfully.', null);
  }

  async getAllTags(groupId: number) {
    const tags = await this.db
      .select({
        id: tagTable.id,
        name: tagTable.name,
        color: tagTable.colorHex,
      })
      .from(tagTable)
      .where(eq(tagTable.groupId, groupId));
    return Result.ok('Fetched all tags successfully.', tags);
  }

  async removeTag(tagId: number) {
    await this.db.delete(tagTable).where(eq(tagTable.id, tagId));
    return Result.ok('Removed tag from group successfully.', null);
  }

  async changeOwner(groupId: number, newOwnerId: number) {
    await this.db
      .update(groupTable)
      .set({ ownerId: newOwnerId })
      .where(eq(groupTable.id, groupId));
    return Result.ok('Changed group owner successfully.', null);
  }

  async acceptMember(groupId: number, userId: number) {
    await this.db
      .update(groupMemberTable)
      .set({ accepted: true })
      .where(
        and(
          eq(groupMemberTable.groupId, groupId),
          eq(groupMemberTable.userId, userId),
        ),
      );
    return Result.ok('Approved member successfully.', null);
  }

  async removeMember(groupId: number, userId: number) {
    await this.db
      .delete(groupMemberTable)
      .where(
        and(
          eq(groupMemberTable.groupId, groupId),
          eq(groupMemberTable.userId, userId),
        ),
      );
    return Result.ok('Removed group member successfully.', null);
  }

  async acceptPost(postId: number) {
    await this.db
      .update(postTable)
      .set({ groupAccepted: true })
      .where(eq(postTable.id, postId));
    return Result.ok('Approved member successfully.', null);
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

  async joinGroup(groupId: number, userId: number) {
    await this.db.insert(groupMemberTable).values({
      groupId,
      userId,
    });
    return Result.ok('Sent join request successfully.', null);
  }

  async remove(groupId: number) {
    const [{ bannerPicture }] = await this.db
      .select({ bannerPicture: groupTable.bannerPicture })
      .from(groupTable)
      .where(eq(groupTable.id, groupId));
    if (bannerPicture) {
      this.fileService.removeSingle(
        getCloudinaryIdFromUrl(bannerPicture),
        'image',
      );
    }

    const posts = await this.db
      .select({
        media: {
          id: mediaTable.id,
          type: mediaTable.type,
        },
      })
      .from(postTable)
      .leftJoin(mediaTable, eq(mediaTable.postId, postTable.id))
      .where(eq(postTable.groupId, groupId));

    for (const p of posts) {
      if (p.media) {
        this.fileService.removeSingle(p.media.id, p.media.type);
      }
    }

    await this.db.delete(groupTable).where(eq(groupTable.id, groupId));
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
        bannerPicture: groupTable.bannerPicture,
        visibility: groupTable.visibility,
        memberCount: groupTable.memberCount,
        description: groupTable.description,
        status: sql<
          'none' | 'pending' | 'joined'
        >`(if(${groupMemberTable.accepted} is null, 'none', if(${groupMemberTable.accepted}, 'joined', 'pending')))`,
        dateJoined: groupMemberTable.dateJoined,
        dateCreated: groupTable.dateCreated,
        dateUpdated: groupTable.dateUpdated,
      })
      .from(groupTable)
      .innerJoin(userTable, eq(userTable.id, groupTable.ownerId))
      .innerJoin(profileTable, eq(profileTable.userId, userTable.id))
      .leftJoin(
        groupMemberTable,
        and(
          eq(groupMemberTable.groupId, groupTable.id),
          eq(groupMemberTable.userId, requesterId),
        ),
      )
      .$dynamic();
  }
}
