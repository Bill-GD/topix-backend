import { ThreadQuery } from '@/common/queries';
import { DatabaseProviderKey } from '@/common/utils/constants';
import { Result } from '@/common/utils/result';
import { DBType } from '@/common/utils/types';
import {
  mediaTable,
  postStatsTable,
  postTable,
  profileTable,
  tagTable,
  threadFollowTable,
  threadTable,
  userTable,
} from '@/database/schemas';
import { CreatePostDto } from '@/modules/post/dto/create-post.dto';
import { PostService } from '@/modules/post/post.service';
import { CreateThreadDto } from '@/modules/thread/dto/create-thread.dto';
import { UpdateThreadDto } from '@/modules/thread/dto/update-thread.dto';
import { Inject, Injectable } from '@nestjs/common';
import { desc, eq, isNull, or, sql } from 'drizzle-orm';

@Injectable()
export class ThreadService {
  constructor(
    @Inject(DatabaseProviderKey) private readonly db: DBType,
    private readonly postService: PostService,
  ) {}

  async getAll(threadQuery: ThreadQuery, requesterId: number) {
    let query = this.getThreadQuery(requesterId);
    if (threadQuery.username) {
      query = query.where(eq(userTable.username, threadQuery.username));
    }
    if (threadQuery.tag) {
      query = query.where(eq(tagTable.name, threadQuery.tag));
    }
    if (threadQuery.groupId) {
      query = query.where(eq(threadTable.groupId, threadQuery.groupId));
    }

    const threads = await query
      .orderBy(desc(threadTable.dateUpdated))
      .limit(threadQuery.limit)
      .offset(threadQuery.offset);

    return Result.ok('Fetched threads successfully', threads);
  }

  async getOne(threadId: number, requesterId: number) {
    const [thread] = await this.getThreadQuery(requesterId).where(
      eq(threadTable.id, threadId),
    );

    return Result.ok('Fetched thread successfully', thread);
  }

  async create(dto: CreateThreadDto, requesterId: number) {
    const [{ id: threadId }] = await this.db
      .insert(threadTable)
      .values({
        ownerId: requesterId,
        title: dto.title,
      })
      .$returningId();
    return Result.ok('Thread created successfully', threadId);
  }

  async addPost(threadId: number, ownerId: number, dto: CreatePostDto) {
    const [{ id: postId }] = await this.db
      .insert(postTable)
      .values({
        ownerId: ownerId,
        threadId: threadId,
        content: dto.content,
      })
      .$returningId();

    await this.db.insert(postStatsTable).values({ postId });
    await this.db
      .update(threadTable)
      .set({ postCount: sql`${threadTable.postCount} + 1` })
      .where(eq(threadTable.id, threadId));

    if (dto.mediaPaths && dto.mediaPaths.length > 0) {
      await this.db.insert(mediaTable).values(
        dto.mediaPaths.map((m) => {
          const segments = m.split('/');
          const publicId = segments[segments.length - 1].split('.')[0];

          return {
            id: publicId,
            postId,
            type: dto.type,
            path: m,
          };
        }),
      );
    }
    return Result.ok('Post added the thread successfully', null);
  }

  async update(threadId: number, dto: UpdateThreadDto) {
    await this.db
      .update(threadTable)
      .set({ title: dto.title })
      .where(eq(threadTable.id, threadId));
    return Result.ok('Updated thread successfully', null);
  }

  async remove(threadId: number) {
    const posts = await this.db
      .select({ id: postTable.id })
      .from(postTable)
      .where(eq(postTable.threadId, threadId));

    await this.postService.removeMultiplePosts(posts.map((p) => p.id));
    await this.db.delete(threadTable).where(eq(threadTable.id, threadId));
    return Result.ok('Deleted thread successfully', null);
  }

  private getThreadQuery(requesterId: number) {
    return this.db
      .select({
        id: threadTable.id,
        title: threadTable.title,
        owner: {
          username: userTable.username,
          displayName: profileTable.displayName,
          profilePicture: profileTable.profilePicture,
        },
        postCount: threadTable.postCount,
        groupId: threadTable.groupId,
        tag: { name: tagTable.name, color: tagTable.colorHex },
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
      .where(
        or(
          eq(threadFollowTable.userId, requesterId),
          isNull(threadFollowTable.userId),
        ),
      )
      .$dynamic();
  }
}
