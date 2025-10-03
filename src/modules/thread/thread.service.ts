import { ThreadQuery } from '@/common/queries';
import { DatabaseProviderKey } from '@/common/utils/constants';
import { Result } from '@/common/utils/result';
import { DBType } from '@/common/utils/types';
import {
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

@Injectable()
export class ThreadService {
  constructor(
    @Inject(DatabaseProviderKey) private readonly db: DBType,
    private readonly postService: PostService,
    private readonly fileService: FileService,
  ) {}

  async getAll(threadQuery: ThreadQuery, requesterId: number) {
    const andQueries: SQL[] = [];

    if (threadQuery.username) {
      andQueries.push(eq(userTable.username, threadQuery.username));
    }
    if (threadQuery.tagId) {
      andQueries.push(eq(tagTable.id, threadQuery.tagId));
    }
    if (threadQuery.groupId) {
      andQueries.push(eq(threadTable.groupId, threadQuery.groupId));
    } else {
      andQueries.push(isNull(threadTable.groupId));
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

  async create(
    dto: CreateThreadDto,
    requesterId: number,
    groupId?: number,
    tagId?: number,
  ) {
    const [{ id: threadId }] = await this.db
      .insert(threadTable)
      .values({
        ownerId: requesterId,
        title: dto.title,
        groupId: groupId,
        tagId: tagId,
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

  async update(threadId: number, dto: UpdateThreadDto) {
    await this.db
      .update(threadTable)
      .set({ title: dto.title })
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
        tag: { name: tagTable.name, color: tagTable.colorHex },
        // if(`thread_follow`.user_id = 7, true, false) `following`,
        following: sql<boolean>`(if(${threadFollowTable.userId} = ${requesterId}, true, false))`,
        dateCreated: threadTable.dateCreated,
        dateUpdated: threadTable.dateUpdated,
      })
      .from(threadTable)
      .innerJoin(userTable, eq(userTable.id, threadTable.ownerId))
      .innerJoin(profileTable, eq(profileTable.userId, userTable.id))
      .leftJoin(
        threadFollowTable,
        eq(threadFollowTable.threadId, threadTable.id),
      )
      .leftJoin(tagTable, eq(threadTable.tagId, tagTable.id))
      .$dynamic();
  }
}
