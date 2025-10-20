import { ThreadQuery } from '@/common/queries';
import { DatabaseProviderKey } from '@/common/utils/constants';
import { Result } from '@/common/utils/result';
import { DBType } from '@/common/utils/types';
import {
  groupMemberTable,
  groupTable,
  mediaTable,
  postTable,
  profileTable,
  tagTable,
  threadFollowTable,
  threadTable,
  userTable,
} from '@/database/schemas';
import { FileService } from '@/modules/file/file.service';
import { CreatePostDto } from '@/modules/post/dto/create-post.dto';
import { PostService } from '@/modules/post/post.service';
import { CreateThreadDto } from '@/modules/thread/dto/create-thread.dto';
import { UpdateThreadDto } from '@/modules/thread/dto/update-thread.dto';
import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, isNull, SQL, sql } from 'drizzle-orm';
import { inArray } from 'drizzle-orm/sql/expressions/conditions';

@Injectable()
export class ThreadService {
  constructor(
    @Inject(DatabaseProviderKey) private readonly db: DBType,
    private readonly postService: PostService,
    private readonly fileService: FileService,
  ) {}

  async getAll(threadQuery: ThreadQuery, requesterId: number) {
    const andQueries: SQL[] = [];

    if (threadQuery.groupId) {
      andQueries.push(eq(threadTable.groupId, threadQuery.groupId));
    } else {
      andQueries.push(isNull(threadTable.groupId));
    }

    if (threadQuery.userId) {
      andQueries.push(eq(userTable.id, threadQuery.userId));
    }
    if (threadQuery.tagId) {
      andQueries.push(eq(tagTable.id, threadQuery.tagId));
    }

    switch (threadQuery.visibility) {
      case 'public':
        andQueries.push(eq(threadTable.visibility, 'public'));
        break;
      case 'private':
        andQueries.push(inArray(threadTable.visibility, ['public', 'private']));
        break;
      case 'hidden':
        andQueries.push(eq(threadTable.visibility, 'hidden'));
        break;
    }

    const threads = await this.getThreadQuery(requesterId)
      .where(and(...andQueries))
      .orderBy(desc(threadTable.dateUpdated))
      .limit(threadQuery.limit)
      .offset(threadQuery.offset);

    return Result.ok('Fetched threads successfully.', threads);
  }

  async getOne(threadId: number, requesterId: number) {
    const [thread] = await this.getThreadQuery(requesterId).where(
      eq(threadTable.id, threadId),
    );

    return Result.ok('Fetched thread successfully.', thread);
  }

  async create(dto: CreateThreadDto, requesterId: number) {
    const [{ id: threadId }] = await this.db
      .insert(threadTable)
      .values({
        ownerId: requesterId,
        title: dto.title,
        groupId: dto.groupId,
        tagId: dto.tagId,
        visibility: dto.visibility,
      })
      .$returningId();
    return Result.ok('Created thread successfully.', threadId);
  }

  async addPost(threadId: number, ownerId: number, dto: CreatePostDto) {
    dto.threadId = threadId;
    await this.postService.create(ownerId, dto, async () => {
      await this.db
        .update(threadTable)
        .set({ postCount: sql`${threadTable.postCount} + 1` })
        .where(eq(threadTable.id, threadId));
    });
    return Result.ok('Added post to thread successfully.', null);
  }

  async followThread(threadId: number, requesterId: number) {
    try {
      await this.db.insert(threadFollowTable).values({
        threadId: threadId,
        userId: requesterId,
      });
    } catch (e) {
      return Result.fail('Thread already followed.');
    }
    return Result.ok('Followed thread successfully', null);
  }

  async unfollowThread(threadId: number, requesterId: number) {
    await this.db
      .delete(threadFollowTable)
      .where(
        and(
          eq(threadFollowTable.threadId, threadId),
          eq(threadFollowTable.userId, requesterId),
        ),
      );
    return Result.ok('Unfollowed thread successfully', null);
  }

  async update(threadId: number, dto: UpdateThreadDto) {
    await this.db
      .update(threadTable)
      .set({ title: dto.title, visibility: dto.visibility })
      .where(eq(threadTable.id, threadId));
    return Result.ok('Updated thread successfully.', null);
  }

  async remove(threadId: number) {
    const posts = await this.db
      .select({
        media: {
          id: mediaTable.id,
          type: mediaTable.type,
        },
      })
      .from(postTable)
      .leftJoin(mediaTable, eq(mediaTable.postId, postTable.id))
      .where(eq(postTable.threadId, threadId));

    this.fileService.remove(
      posts
        .filter((e) => e.media !== null)
        .map((e) => ({ publicId: e.media!.id, type: e.media!.type })),
    );

    await this.db.delete(threadTable).where(eq(threadTable.id, threadId));
    return Result.ok('Deleted thread successfully.', null);
  }

  private getThreadQuery(requesterId: number) {
    return this.db
      .select({
        id: threadTable.id,
        title: threadTable.title,
        owner: {
          id: userTable.id,
          username: userTable.username,
          displayName: profileTable.displayName,
          profilePicture: profileTable.profilePicture,
        },
        postCount: threadTable.postCount,
        groupId: threadTable.groupId,
        groupName: groupTable.name,
        groupVisibility: groupTable.visibility,
        joinedGroup: groupMemberTable.accepted,
        tag: { name: tagTable.name, color: tagTable.colorHex },
        followed: sql<boolean>`(if(${threadFollowTable.userId} = ${requesterId}, true, false))`,
        visibility: threadTable.visibility,
        dateCreated: threadTable.dateCreated,
        dateUpdated: threadTable.dateUpdated,
      })
      .from(threadTable)
      .innerJoin(userTable, eq(userTable.id, threadTable.ownerId))
      .innerJoin(profileTable, eq(profileTable.userId, userTable.id))
      .leftJoin(groupTable, eq(threadTable.groupId, groupTable.id))
      .leftJoin(
        threadFollowTable,
        eq(threadFollowTable.threadId, threadTable.id),
      )
      .leftJoin(
        groupMemberTable,
        and(
          eq(groupMemberTable.groupId, groupTable.id),
          eq(groupMemberTable.userId, requesterId),
        ),
      )
      .leftJoin(tagTable, eq(threadTable.tagId, tagTable.id))
      .$dynamic();
  }
}
