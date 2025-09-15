import { DatabaseProviderKey } from '@/common/utils/constants';
import { Result } from '@/common/utils/result';
import { DBType } from '@/common/utils/types';
import { mediaTable, postStatsTable, postTable } from '@/database/schemas';
import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
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
    const res = await this.db
      .select({
        id: postTable.id,
        content: postTable.content,
        reactionCount: postStatsTable.reactionCount,
        replyCount: postStatsTable.replyCount,
        media: mediaTable.path,
        dateCreated: postTable.dateCreated,
      })
      .from(postTable)
      .innerJoin(postStatsTable, eq(postStatsTable.postId, postTable.id))
      .leftJoin(mediaTable, eq(mediaTable.postId, postTable.id))
      .where(eq(postTable.ownerId, userId));

    const posts: {
      id: number;
      content: string;
      reactionCount: number;
      replyCount: number;
      mediaPaths: string[];
      dateCreated: Date;
    }[] = Object.values(
      res.reduce((acc, row) => {
        if (!acc[row.id]) {
          acc[row.id] = { ...row, mediaPaths: [] };
        }
        if (row.media) {
          acc[row.id].mediaPaths.push(row.media);
        }
        return acc;
      }, {}),
    );

    return Result.ok('Fetched user posts successfully', {
      posts,
    });
  }

  async findOne(postId: number) {
    const res = await this.db
      .select({
        id: postTable.id,
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

    let post: {
      id: number;
      content: string;
      reactionCount: number;
      replyCount: number;
      mediaPaths: string[];
      dateCreated: Date;
      media: undefined;
    } = { ...res[0], media: undefined, mediaPaths: [] };

    const mediaPaths = res
      .map((p) => p.media!)
      .reduce((p: string[], c) => {
        p.push(c);
        return p;
      }, []);
    post = { ...post, mediaPaths };

    return Result.ok('Post fetched successfully', post);
  }

  async update(id: number, dto: UpdatePostDto) {
    return Result.ok('Post updated successfully', null);
  }

  async remove(id: number) {
    return Result.ok('Post deleted successfully', null);
  }
}
