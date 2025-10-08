import { PostQuery } from '@/common/queries';
import { DatabaseProviderKey } from '@/common/utils/constants';
import { getCloudinaryIdFromUrl } from '@/common/utils/helpers';
import { Result } from '@/common/utils/result';
import { DBType } from '@/common/utils/types';
import {
  mediaTable,
  postStatsTable,
  postTable,
  profileTable,
  reactionTable,
  tagTable,
  threadTable,
  userTable,
} from '@/database/schemas';
import { FileService } from '@/modules/file/file.service';
import { ReactDto } from '@/modules/post/dto/react.dto';
import { UpdatePostDto } from '@/modules/post/dto/update-post.dto';
import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, isNull, SQL, sql } from 'drizzle-orm';
import { inArray } from 'drizzle-orm/sql/expressions/conditions';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostService {
  constructor(
    @Inject(DatabaseProviderKey) private readonly db: DBType,
    private readonly fileService: FileService,
  ) {}

  async create(
    ownerId: number,
    dto: CreatePostDto,
    additional?: () => Promise<void>,
  ) {
    const [{ id: postId }] = await this.db
      .insert(postTable)
      .values({
        ownerId: ownerId,
        content: dto.content,
        threadId: dto.threadId,
        groupId: dto.groupId,
        tagId: dto.tagId,
        groupApproved: dto.approved,
        visibility: dto.visibility,
      })
      .$returningId();

    await this.db.insert(postStatsTable).values({ postId });

    await additional?.();

    if (dto.fileObjects) {
      await this.uploadFileObjects(postId, dto.type, dto.fileObjects);
    }
    return Result.ok('Uploaded post successfully.', postId);
  }

  async getAll(postQuery: PostQuery, requesterId: number) {
    const andQueries: SQL[] = [];

    if (postQuery.groupId) {
      andQueries.push(
        eq(postTable.groupId, postQuery.groupId),
        eq(postTable.groupApproved, postQuery.accepted),
      );
      if (!postQuery.parentId) andQueries.push(isNull(postTable.parentPostId));
      if (postQuery.tagId) andQueries.push(eq(tagTable.id, postQuery.tagId));
    } else {
      andQueries.push(isNull(postTable.groupId));
    }

    if (postQuery.threadId) {
      andQueries.push(eq(postTable.threadId, postQuery.threadId));
      if (!postQuery.parentId) andQueries.push(isNull(postTable.parentPostId));
    } else {
      andQueries.push(isNull(postTable.threadId));
    }

    if (postQuery.parentId) {
      andQueries.push(eq(postTable.parentPostId, postQuery.parentId));
    }

    if (postQuery.username) {
      andQueries.push(eq(userTable.username, postQuery.username));
    }
    switch (postQuery.visibility) {
      case 'public':
        andQueries.push(eq(postTable.visibility, 'public'));
        break;
      case 'private':
        andQueries.push(inArray(postTable.visibility, ['public', 'private']));
        break;
      case 'hidden':
        andQueries.push(eq(postTable.visibility, 'hidden'));
        break;
    }

    const posts = await this.getPostQuery(requesterId)
      .where(and(...andQueries))
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
      'Fetched posts successfully.',
      posts.map((p) => ({
        ...p,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        parentPost:
          p.parentPostId !== null ? parents.get(p.parentPostId) : undefined,
        mediaPaths: p.media ? p.media.split(';') : [],
      })),
    );
  }

  async getOne(postId: number, requesterId: number) {
    const currentPost = await this.getSinglePost(postId, requesterId);
    if (!currentPost.parentPostId) {
      return Result.ok('Fetched post successfully.', currentPost);
    }

    const parentPost = await this.getSinglePost(
      currentPost.parentPostId,
      requesterId,
    );

    return Result.ok('Post fetched successfully', {
      ...currentPost,
      parentPost,
    });
  }

  async update(postId: number, dto: UpdatePostDto) {
    await this.db
      .update(postTable)
      .set({ visibility: dto.visibility })
      .where(eq(postTable.id, postId));
    return Result.ok('Post updated successfully', null);
  }

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
    return Result.ok('Updated post reaction successfully.', null);
  }

  async removeReaction(postId: number, userId: number) {
    await this.db
      .delete(reactionTable)
      .where(
        and(eq(reactionTable.postId, postId), eq(reactionTable.userId, userId)),
      );
    return Result.ok('Updated post reaction successfully.', null);
  }

  async reply(postId: number, ownerId: number, dto: CreatePostDto) {
    const [{ id: replyId }] = await this.db
      .insert(postTable)
      .values({
        ownerId: ownerId,
        content: dto.content,
        parentPostId: postId,
        groupId: dto.groupId,
        threadId: dto.threadId,
        groupApproved: dto.approved,
      })
      .$returningId();

    await this.db.insert(postStatsTable).values({ postId: replyId });
    await this.db
      .update(postStatsTable)
      .set({ replyCount: sql`${postStatsTable.replyCount} + 1` })
      .where(eq(postStatsTable.postId, postId));

    if (dto.fileObjects) {
      await this.uploadFileObjects(postId, dto.type, dto.fileObjects);
    }
    return Result.ok('Posted reply successfully.', null);
  }

  async remove(postId: number) {
    const posts = await this.db
      .select({
        parentPostId: postTable.parentPostId,
        threadId: postTable.threadId,
        media: {
          id: mediaTable.id,
          type: mediaTable.type,
        },
      })
      .from(postTable)
      .leftJoin(mediaTable, eq(mediaTable.postId, postTable.id))
      .where(eq(postTable.id, postId));

    this.fileService.remove(
      posts
        .filter((e) => e.media !== null)
        .map((e) => ({ publicId: e.media!.id, type: e.media!.type })),
    );

    if (posts[0].parentPostId) {
      await this.db
        .update(postStatsTable)
        .set({ replyCount: sql`${postStatsTable.replyCount} - 1` })
        .where(eq(postStatsTable.postId, posts[0].parentPostId));
    }

    if (posts[0].threadId) {
      await this.db
        .update(threadTable)
        .set({ postCount: sql`${threadTable.postCount} - 1` })
        .where(eq(threadTable.id, posts[0].threadId));
    }

    await this.db.delete(postTable).where(eq(postTable.id, postId));
    return Result.ok('Deleted post successfully.', null);
  }

  private async uploadFileObjects(
    postId: number,
    type: 'image' | 'video',
    fileObjects: Array<Express.Multer.File>,
  ) {
    const res = await this.fileService.upload(fileObjects);
    const mediaPaths = res.data;

    if (mediaPaths.length > 0) {
      await this.db.insert(mediaTable).values(
        mediaPaths.map((m) => ({
          id: getCloudinaryIdFromUrl(m),
          postId,
          type: type,
          path: m,
        })),
      );
    }
  }

  private async getSinglePost(postId: number, requesterId: number) {
    const [res] = await this.getPostQuery(requesterId).where(
      eq(postTable.id, postId),
    );

    return {
      ...res,
      mediaPaths: res.media ? res.media.split(';') : [],
    };
  }

  private async getMultiplePosts(postIds: number[], requesterId: number) {
    const res = await this.getPostQuery(requesterId).where(
      inArray(postTable.id, postIds),
    );

    return res.map((r) => ({
      ...r,
      mediaPaths: r.media ? r.media.split(';') : [],
    }));
  }

  private getPostQuery(requesterId: number) {
    return this.db
      .select({
        id: postTable.id,
        owner: {
          id: userTable.id,
          username: userTable.username,
          displayName: profileTable.displayName,
          profilePicture: profileTable.profilePicture,
        },
        content: postTable.content,
        reaction: reactionTable.type,
        reactionCount: this.db.$count(
          reactionTable,
          eq(reactionTable.postId, postTable.id),
        ),
        replyCount: postStatsTable.replyCount,
        media: sql<string>`(group_concat(${mediaTable.path} separator ';'))`,
        parentPostId: postTable.parentPostId,
        threadId: postTable.threadId,
        groupId: postTable.groupId,
        tag: { name: tagTable.name, color: tagTable.colorHex },
        groupApproved: postTable.groupApproved,
        visibility: postTable.visibility,
        dateCreated: postTable.dateCreated,
        dateUpdated: postTable.dateUpdated,
      })
      .from(postTable)
      .innerJoin(postStatsTable, eq(postStatsTable.postId, postTable.id))
      .innerJoin(userTable, eq(userTable.id, postTable.ownerId))
      .innerJoin(profileTable, eq(profileTable.userId, userTable.id))
      .leftJoin(
        reactionTable,
        and(
          eq(reactionTable.postId, postTable.id),
          eq(reactionTable.userId, requesterId),
        ),
      )
      .leftJoin(mediaTable, eq(mediaTable.postId, postTable.id))
      .leftJoin(tagTable, eq(postTable.tagId, tagTable.id))
      .groupBy(
        postTable.id,
        reactionTable.userId,
        reactionTable.type,
        postStatsTable.replyCount,
        postTable.dateCreated,
      )
      .$dynamic();
  }
}
