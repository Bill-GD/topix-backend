import { ThreadQuery } from '@/common/queries';
import { DatabaseProviderKey } from '@/common/utils/constants';
import { Result } from '@/common/utils/result';
import { DBType } from '@/common/utils/types';
import {
  profileTable,
  tagTable,
  threadFollowTable,
  threadTable,
  userTable,
} from '@/database/schemas';
import { Inject, Injectable } from '@nestjs/common';
import { desc, eq, isNull, or } from 'drizzle-orm';

@Injectable()
export class ThreadService {
  constructor(@Inject(DatabaseProviderKey) private readonly db: DBType) {}

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

  // create(createThreadDto: CreateThreadDto) {
  //   return 'This action adds a new thread';
  // }

  // update(id: number, updateThreadDto: UpdateThreadDto) {
  //   return `This action updates a #${id} thread`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} thread`;
  // }

  private getThreadQuery(requesterId: number) {
    return this.db
      .select({
        id: threadTable.id,
        title: threadTable.title,
        groupId: threadTable.groupId,
        tag: tagTable.name,
        tagColor: tagTable.colorHex,
        username: userTable.username,
        displayName: profileTable.displayName,
        profilePicture: profileTable.profilePicture,
        postCount: threadTable.postCount,
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
