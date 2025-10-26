import { CommonQuery } from '@/common/queries/common.query';
import { DatabaseProviderKey } from '@/common/utils/constants';
import { Result } from '@/common/utils/result';
import { DBType } from '@/common/utils/types';
import {
  notificationTable,
  postTable,
  profileTable,
  threadTable,
  userTable,
} from '@/database/schemas';
import { NotificationDto } from '@/modules/notification/dto/notification.dto';
import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, like, lt, sql } from 'drizzle-orm';

@Injectable()
export class NotificationService {
  constructor(@Inject(DatabaseProviderKey) private readonly db: DBType) {}

  async create(dto: NotificationDto) {
    const res = await this.db
      .select()
      .from(notificationTable)
      .where(
        like(
          notificationTable.id,
          `${dto.receiverId}:${dto.type}:${dto.objectId}:%`,
        ),
      )
      .orderBy(desc(notificationTable.dateCreated));

    const noti = res.at(0);

    if (
      !noti ||
      (noti && Date.now() - Number(noti.id.split(':').at(-1)) >= 432000000) // 5 days
    ) {
      await this.db.insert(notificationTable).values({
        id: `${dto.receiverId}:${dto.type}:${dto.objectId}:${Date.now()}`,
        receiverId: dto.receiverId,
        actorId: dto.actorId,
        actionType: dto.type,
        objectId: dto.objectId,
      });
    } else if (noti.actorId !== dto.actorId) {
      await this.db
        .update(notificationTable)
        .set({
          actorCount: sql`${notificationTable.actorCount} + 1`,
          dateCreated: sql`(now())`,
        })
        .where(eq(notificationTable.id, noti.id));
    }
  }

  async getAll(notiQuery: CommonQuery, requesterId: number) {
    const res = await this.db
      .select({
        id: notificationTable.id,
        actor: {
          id: userTable.id,
          username: userTable.username,
          displayName: profileTable.displayName,
          profilePicture: profileTable.profilePicture,
        },
        actorCount: notificationTable.actorCount,
        type: notificationTable.actionType,
        objectId: notificationTable.objectId,
        dateCreated: notificationTable.dateCreated,
        postContent: postTable.content,
        threadTitle: threadTable.title,
      })
      .from(notificationTable)
      .innerJoin(userTable, eq(userTable.id, notificationTable.actorId))
      .innerJoin(profileTable, eq(profileTable.userId, userTable.id))
      .leftJoin(postTable, eq(postTable.id, notificationTable.objectId))
      .leftJoin(threadTable, eq(threadTable.id, notificationTable.objectId))
      .where(eq(notificationTable.receiverId, requesterId))
      .orderBy(desc(notificationTable.dateCreated))
      .limit(notiQuery.limit)
      .offset(notiQuery.offset);
    return Result.ok('Fetched notifications', res);
  }

  async count(requesterId: number) {
    const [{ count }] = await this.db
      .select({
        count: sql<number>`(count(1))`,
      })
      .from(notificationTable)
      .innerJoin(userTable, eq(userTable.id, notificationTable.receiverId))
      .where(
        and(
          eq(notificationTable.receiverId, requesterId),
          lt(userTable.notificationLastSeenAt, notificationTable.dateCreated),
        ),
      );
    return Result.ok('Fetched notification count', count);
  }

  async updateLastSeen(userId: number) {
    await this.db
      .update(userTable)
      .set({ notificationLastSeenAt: sql`(now())` })
      .where(eq(userTable.id, userId));
  }
}
