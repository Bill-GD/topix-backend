import { DatabaseProviderKey } from '@/common/utils/constants';
import { Result } from '@/common/utils/result';
import { DBType } from '@/common/utils/types';
import { mediaTable, postTable } from '@/database/schemas';
import { Inject, Injectable } from '@nestjs/common';
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

  findAll() {
    return `This action returns all post`;
  }

  findOne(id: number) {
    return `This action returns a #${id} post`;
  }

  update(id: number, dto: UpdatePostDto) {
    return `This action updates a #${id} post`;
  }

  remove(id: number) {
    return `This action removes a #${id} post`;
  }
}
