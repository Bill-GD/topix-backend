import { PostQuery } from '@/common/queries';
import { DatabaseProviderKey } from '@/common/utils/constants';
import { Result } from '@/common/utils/result';
import { DBType } from '@/common/utils/types';
import {
  mediaTable,
  postStatsTable,
  postTable,
  profileTable,
  reactionTable,
  tagTable,
  userTable,
} from '@/database/schemas';
import { FileService } from '@/modules/file/file.service';
import { ReactDto } from '@/modules/post/dto/react.dto';
import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, isNull, or, sql } from 'drizzle-orm';
import { inArray } from 'drizzle-orm/sql/expressions/conditions';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostService {
  constructor(
    @Inject(DatabaseProviderKey) private readonly db: DBType,
    private readonly fileService: FileService,
  ) {}

  async create(ownerId: number, dto: CreatePostDto) {
    const [{ id: postId }] = await this.db
      .insert(postTable)
      .values({
        ownerId: ownerId,
        content: dto.content,
      })
      .$returningId();

    await this.db.insert(postStatsTable).values({ postId });

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
    return Result.ok('Post uploaded successfully', postId);
  }

  async getAll(postQuery: PostQuery, requesterId: number) {
    let query = this.getPostQuery(requesterId);
    if (postQuery.username) {
      query = query.where(eq(userTable.username, postQuery.username));
    }
    if (postQuery.tag) {
      query = query.where(eq(tagTable.name, postQuery.tag));
    }
    if (postQuery.parentId) {
      query = query.where(eq(postTable.parentPostId, postQuery.parentId));
    }
    if (postQuery.groupId) {
      query = query.where(eq(postTable.groupId, postQuery.groupId));
    }
    if (postQuery.threadId) {
      query = query.where(eq(postTable.threadId, postQuery.threadId));
    }

    const posts = await query
      .orderBy(desc(postTable.dateCreated))
      .offset(postQuery.offset)
      .limit(postQuery.limit);

    let parents: Map<number, any>;
    const parentPostIds = posts
      .map((p) => p.parentPostId)
      .filter((e) => e !== null);

    if (parentPostIds.length > 0) {
      parents = new Map(
        (await this.getMultiplePosts(parentPostIds, requesterId)).map((p) => [
          p.id,
          p,
        ]),
      );
    }

    return Result.ok(
      'Fetched posts successfully',
      posts.map((p) => ({
        id: p.id,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        parentPost:
          p.parentPostId !== null ? parents.get(p.parentPostId) : undefined,
        owner: p.owner,
        content: p.content,
        reaction: p.reaction,
        reactionCount: p.reactionCount,
        replyCount: p.replyCount,
        mediaPaths: p.media ? (p.media as string).split(';') : [],
        dateCreated: p.dateCreated,
        dateUpdated: p.dateUpdated,
      })),
    );
  }

  async getOne(postId: number, requesterId: number) {
    const currentPost = await this.getSinglePost(postId, requesterId);
    if (!currentPost.parentPostId) {
      return Result.ok('Post fetched successfully', currentPost);
    }

    const parentPost = await this.getSinglePost(
      currentPost.parentPostId,
      requesterId,
    );

    return Result.ok('Post fetched successfully', {
      id: currentPost.id,
      owner: currentPost.owner,
      parentPost,
      content: currentPost.content,
      reaction: currentPost.reaction,
      reactionCount: currentPost.reactionCount,
      replyCount: currentPost.replyCount,
      mediaPaths: currentPost.mediaPaths,
      dateCreated: currentPost.dateCreated,
      dateUpdated: currentPost.dateUpdated,
    });
  }

  // async update(postId: number, dto: UpdatePostDto) {
  //   return Result.ok('Post updated successfully', null);
  // }

  async updateReaction(postId: number, userId: number, dto: ReactDto) {
    const res = await this.db.$count(
      reactionTable,
      and(eq(reactionTable.postId, postId), eq(reactionTable.userId, userId)),
    );

    if (res < 1) {
      await this.db.insert(reactionTable).values({
        postId,
        userId: userId,
        type: dto.reaction,
      });
      await this.db
        .update(postStatsTable)
        .set({ reactionCount: sql`${postStatsTable.reactionCount} + 1` })
        .where(eq(postStatsTable.postId, postId));
    }
    if (res >= 1) {
      await this.db
        .update(reactionTable)
        .set({ type: dto.reaction })
        .where(
          and(
            eq(reactionTable.postId, postId),
            eq(reactionTable.userId, userId),
          ),
        );
    }
    return Result.ok('Updated post reaction successfully', null);
  }

  async removeReaction(postId: number, userId: number) {
    await this.db
      .delete(reactionTable)
      .where(
        and(eq(reactionTable.postId, postId), eq(reactionTable.userId, userId)),
      );
    await this.db
      .update(postStatsTable)
      .set({ reactionCount: sql`${postStatsTable.reactionCount} - 1` })
      .where(eq(postStatsTable.postId, postId));
    return Result.ok('Updated post reaction successfully', null);
  }

  async reply(postId: number, ownerId: number, dto: CreatePostDto) {
    const [{ id: replyId }] = await this.db
      .insert(postTable)
      .values({
        ownerId: ownerId,
        content: dto.content,
        parentPostId: postId,
      })
      .$returningId();

    await this.db.insert(postStatsTable).values({ postId: replyId });
    await this.db
      .update(postStatsTable)
      .set({ replyCount: sql`${postStatsTable.replyCount} + 1` })
      .where(eq(postStatsTable.postId, postId));

    if (dto.mediaPaths && dto.mediaPaths.length > 0) {
      await this.db.insert(mediaTable).values(
        dto.mediaPaths.map((m) => {
          const segments = m.split('/');
          const publicId = segments[segments.length - 1].split('.')[0];

          return {
            id: publicId,
            postId: replyId,
            type: dto.type,
            path: m,
          };
        }),
      );
    }
    return Result.ok('Posted reply successfully', null);
  }

  async remove(postId: number) {
    await this.removeMultiplePosts([postId]);
    return Result.ok('Post deleted successfully', null);
  }

  async removeMultiplePosts(postIds: number[]) {
    const posts = await this.db
      .select({
        parentPostId: postTable.parentPostId,
        media: {
          id: mediaTable.id,
          type: mediaTable.type,
        },
      })
      .from(postTable)
      .leftJoin(mediaTable, eq(mediaTable.postId, postTable.id))
      .where(inArray(postTable.id, postIds));

    for (const p of posts) {
      if (p.media) {
        void this.fileService.removeSingle(p.media.id, p.media.type);
      }
    }

    for (const p of posts) {
      if (p.parentPostId) {
        await this.db
          .update(postStatsTable)
          .set({ replyCount: sql`${postStatsTable.replyCount} - 1` })
          .where(eq(postStatsTable.postId, p.parentPostId));
      }
    }

    await this.db.delete(postTable).where(inArray(postTable.id, postIds));
  }

  private async getSinglePost(postId: number, requesterId: number) {
    const res = await this.getPostQuery(requesterId).where(
      eq(postTable.id, postId),
    );

    return {
      id: res[0].id,
      owner: res[0].owner,
      parentPostId: res[0].parentPostId,
      content: res[0].content,
      reaction: res[0].reaction,
      reactionCount: res[0].reactionCount,
      replyCount: res[0].replyCount,
      mediaPaths: res[0].media ? (res[0].media as string).split(';') : [],
      dateCreated: res[0].dateCreated,
      dateUpdated: res[0].dateUpdated,
    };
  }

  private async getMultiplePosts(postIds: number[], requesterId: number) {
    const res = await this.getPostQuery(requesterId).where(
      inArray(postTable.id, postIds),
    );

    return res.map((r) => ({
      id: r.id,
      owner: r.owner,
      parentPostId: r.parentPostId,
      content: r.content,
      reaction: r.reaction,
      reactionCount: r.reactionCount,
      replyCount: r.replyCount,
      mediaPaths: r.media ? (r.media as string).split(';') : [],
      dateCreated: r.dateCreated,
      dateUpdated: r.dateUpdated,
    }));
  }

  private getPostQuery(requesterId: number) {
    return this.db
      .select({
        id: postTable.id,
        owner: {
          username: userTable.username,
          displayName: profileTable.displayName,
          profilePicture: profileTable.profilePicture,
        },
        content: postTable.content,
        reaction: reactionTable.type,
        reactionCount: postStatsTable.reactionCount,
        replyCount: postStatsTable.replyCount,
        media: sql`(group_concat(${mediaTable.path} separator ';'))`,
        parentPostId: postTable.parentPostId,
        threadId: postTable.threadId,
        groupId: postTable.groupId,
        tag: { name: tagTable.name, color: tagTable.colorHex },
        groupAccepted: postTable.groupAccepted,
        dateCreated: postTable.dateCreated,
        dateUpdated: postTable.dateUpdated,
      })
      .from(postTable)
      .innerJoin(postStatsTable, eq(postStatsTable.postId, postTable.id))
      .innerJoin(userTable, eq(userTable.id, postTable.ownerId))
      .innerJoin(profileTable, eq(profileTable.userId, userTable.id))
      .leftJoin(reactionTable, eq(reactionTable.postId, postTable.id))
      .leftJoin(mediaTable, eq(mediaTable.postId, postTable.id))
      .leftJoin(tagTable, eq(postTable.tagId, tagTable.id))
      .where(
        or(eq(reactionTable.userId, requesterId), isNull(reactionTable.userId)),
      )
      .groupBy(
        postTable.id,
        reactionTable.type,
        postStatsTable.reactionCount,
        postStatsTable.replyCount,
        postTable.dateCreated,
      )
      .$dynamic();
  }
}
