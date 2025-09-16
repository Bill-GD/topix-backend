import { DatabaseProviderKey } from '@/common/utils/constants';
import { Result } from '@/common/utils/result';
import { DBType } from '@/common/utils/types';
import {
  mediaTable,
  postStatsTable,
  postTable,
  profileTable,
  userTable,
} from '@/database/schemas';
import { Inject, Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { inArray } from 'drizzle-orm/sql/expressions/conditions';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostService {
  constructor(@Inject(DatabaseProviderKey) private readonly db: DBType) {}

  async create(dto: CreatePostDto) {
    const [{ id: postId }] = await this.db
      .insert(postTable)
      .values({
        ownerId: dto.ownerId,
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

  async findAllOfUser(userId: number) {
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

    return Result.ok(
      'Fetched user posts successfully',
      posts.map((p, i) => ({ ...p, mediaPaths: mediaPaths[i] })),
    );
  }

  async findOne(postId: number) {
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

    if (res.length <= 0) {
      return Result.fail('Post not found');
    }

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

    return Result.ok('Post fetched successfully', { ...post, owner });
  }

  async update(id: number, dto: UpdatePostDto) {
    return Result.ok('Post updated successfully', null);
  }

  async remove(id: number) {
    return Result.ok('Post deleted successfully', null);
  }
}
