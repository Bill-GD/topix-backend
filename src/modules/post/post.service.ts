import { DatabaseProviderKey } from '@/common/utils/constants';
import { Result } from '@/common/utils/result';
import { DBType } from '@/common/utils/types';
import {
  mediaTable,
  postStatsTable,
  postTable,
  profileTable,
  reactionTable,
  userTable,
} from '@/database/schemas';
import { ReactDto } from '@/modules/post/dto/react.dto';
import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, sql } from 'drizzle-orm';
import { inArray } from 'drizzle-orm/sql/expressions/conditions';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostService {
  constructor(@Inject(DatabaseProviderKey) private readonly db: DBType) {}

  async create(dto: CreatePostDto, ownerId: number) {
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

  async findAll() {
    return Result.ok('Post fetched successfully', null);
  }

  async getPostsOfUser(userId: number, requesterId: number) {
    const posts = await this.db
      .select({
        id: postTable.id,
        content: postTable.content,
        reactionCount: postStatsTable.reactionCount,
        replyCount: postStatsTable.replyCount,
        dateCreated: postTable.dateCreated,
      })
      .from(postTable)
      .innerJoin(postStatsTable, eq(postStatsTable.postId, postTable.id))
      .where(eq(postTable.ownerId, userId))
      .orderBy(desc(postTable.dateCreated))
      .limit(5);

    const postIds = posts.map((p) => p.id);

    const medias = await this.db
      .select({
        postId: mediaTable.postId,
        path: mediaTable.path,
      })
      .from(mediaTable)
      .where(inArray(mediaTable.postId, postIds));

    const mediaPaths: string[][] = [];

    for (const postId of postIds) {
      const m = medias.filter((e) => e.postId === postId).map((e) => e.path);
      mediaPaths.push(m);
    }

    const reactionMap = new Map(
      (
        await this.db
          .select({
            postId: reactionTable.postId,
            reaction: reactionTable.type,
          })
          .from(reactionTable)
          .where(
            and(
              eq(reactionTable.userId, requesterId),
              inArray(reactionTable.postId, postIds),
            ),
          )
      ).map((r) => [r.postId, r.reaction]),
    );

    return Result.ok(
      'Fetched user posts successfully',
      posts.map((p, i) => ({
        ...p,
        mediaPaths: mediaPaths[i],
        reaction: reactionMap.get(p.id) ?? null,
      })),
    );
  }

  async findOne(postId: number, requesterId: number) {
    const res = await this.db
      .select({
        id: postTable.id,
        ownerId: postTable.ownerId,
        content: postTable.content,
        reactionCount: postStatsTable.reactionCount,
        replyCount: postStatsTable.replyCount,
        media: mediaTable.path,
        dateCreated: postTable.dateCreated,
      })
      .from(postTable)
      .innerJoin(postStatsTable, eq(postStatsTable.postId, postTable.id))
      .leftJoin(mediaTable, eq(mediaTable.postId, postTable.id))
      .where(eq(postTable.id, postId));

    let post = { ...res[0], media: undefined, mediaPaths: [] };

    if (res.length >= 1 && res[0].media) {
      const mediaPaths = res
        .map((p) => p.media!)
        .reduce((p: string[], c) => {
          p.push(c);
          return p;
        }, []);
      // @ts-expect-error mediaPaths is expected
      post = { ...post, mediaPaths };
    }

    const [owner] = await this.db
      .select({
        id: userTable.id,
        username: userTable.username,
        displayName: profileTable.displayName,
        description: profileTable.description,
        profilePicture: profileTable.profilePicture,
        followerCount: profileTable.followerCount,
        followingCount: profileTable.followingCount,
        role: userTable.role,
      })
      .from(userTable)
      .innerJoin(profileTable, eq(userTable.id, profileTable.userId))
      .where(eq(userTable.id, post.ownerId));

    const reaction = await this.db
      .select({ reaction: reactionTable.type })
      .from(reactionTable)
      .where(
        and(
          eq(reactionTable.userId, requesterId),
          eq(reactionTable.postId, postId),
        ),
      );

    return Result.ok('Post fetched successfully', {
      ...post,
      owner,
      reaction: reaction.length < 1 ? null : reaction[0].reaction,
    });
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

  async update(id: number, dto: UpdatePostDto) {
    return Result.ok('Post updated successfully', null);
  }

  async remove(id: number) {
    return Result.ok('Post deleted successfully', null);
  }
}
