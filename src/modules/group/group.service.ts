import { GroupQuery, MemberQuery } from '@/common/queries';
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
import { CreateGroupPostDto } from '@/modules/group/dto/create-group-post.dto';
import { CreateGroupThreadDto } from '@/modules/group/dto/create-group-thread.dto';
import { CreateTagDto } from '@/modules/group/dto/create-tag.dto';
import { PostService } from '@/modules/post/post.service';
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
      const res = await this.fileService.upload([dto.bannerFile]);
      bannerUrl = res.data[0];
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

  async addPost(groupId: number, ownerId: number, dto: CreateGroupPostDto) {
    await this.postService.create(
      ownerId,
      dto,
      undefined,
      groupId,
      dto.tagId,
      dto.accepted,
    );
    return Result.ok('Uploaded post to group successfully.', null);
  }

  async addThread(groupId: number, ownerId: number, dto: CreateGroupThreadDto) {
    await this.threadService.create(dto, ownerId, groupId, dto.tagId);
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

  async getAllMembers(groupId: number, memberQuery: MemberQuery) {
    const members = await this.db
      .select({
        id: userTable.id,
        username: userTable.username,
        displayName: profileTable.displayName,
        profilePicture: profileTable.profilePicture,
        accepted: groupMemberTable.accepted,
        dateRequested: groupMemberTable.dateRequested,
        dateJoined: sql<Date | null>`(if(${groupMemberTable.accepted}, ${groupMemberTable.dateJoined}, null))`,
      })
      .from(groupMemberTable)
      .innerJoin(userTable, eq(userTable.id, groupMemberTable.userId))
      .innerJoin(profileTable, eq(profileTable.userId, userTable.id))
      .where(
        and(
          eq(groupMemberTable.groupId, groupId),
          eq(groupMemberTable.accepted, memberQuery.accepted),
        ),
      )
      .limit(memberQuery.limit)
      .offset(memberQuery.offset);

    return Result.ok('Fetched all members successfully.', members);
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
      .set({ groupAccepted: true, dateUpdated: null })
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
        this.fileService.remove([{ publicId, type: 'image' }]);
      }
      bannerUrl = (await this.fileService.upload([dto.bannerFile])).data[0];
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
      this.fileService.remove([
        {
          publicId: getCloudinaryIdFromUrl(bannerPicture),
          type: 'image',
        },
      ]);
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

    this.fileService.remove(
      posts
        .filter((e) => e.media !== null)
        .map((e) => ({ publicId: e.media!.id, type: e.media!.type })),
    );

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
        memberCount: this.db.$count(
          groupMemberTable,
          eq(groupMemberTable.groupId, groupTable.id),
        ),
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
