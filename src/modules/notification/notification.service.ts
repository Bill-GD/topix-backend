import { CommonQuery } from '@/common/queries/common.query';
import { DatabaseProviderKey } from '@/common/utils/constants';
import { Result } from '@/common/utils/result';
import { DBType } from '@/common/utils/types';
import {
  chatMessageTable,
  notificationTable,
  profileTable,
  userTable,
} from '@/database/schemas';
import { NotificationDto } from '@/modules/notification/dto/notification.dto';
import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, lt, sql } from 'drizzle-orm';

@Injectable()
export class NotificationService {
  constructor(@Inject(DatabaseProviderKey) private readonly db: DBType) {}

  async create(dto: NotificationDto) {
    const res = await this.db
      .select()
      .from(notificationTable)
      .where(
        eq(
          notificationTable.id,
          `${dto.receiverId}:${dto.type}:${dto.objectId}`,
        ),
      );

    if (res.length <= 0) {
      await this.db.insert(notificationTable).values({
        id: `${dto.receiverId}:${dto.type}:${dto.objectId}`,
        receiverId: dto.receiverId,
        actorId: dto.actorId,
        actionType: dto.type,
        objectId: dto.objectId,
      });
    }

    const noti = res[0];

    await this.db
      .update(notificationTable)
      .set({
        actorCount: sql`${notificationTable.actorCount} + 1`,
        dateCreated: sql`(now())`,
      })
      .where(eq(notificationTable.id, noti.id));
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
      })
      .from(notificationTable)
      .innerJoin(userTable, eq(userTable.id, notificationTable.actorId))
      .innerJoin(profileTable, eq(profileTable.userId, userTable.id))
      .where(eq(notificationTable.receiverId, requesterId))
      .orderBy(desc(notificationTable.dateCreated))
      .limit(notiQuery.limit)
      .offset(notiQuery.offset);
    return Result.ok('Fetched notifications', res);
  }

  async count(requesterId: number) {
    const res = await this.db.$count(
      notificationTable,
      and(
        eq(notificationTable.receiverId, requesterId),
        lt(userTable.notificationLastSeenAt, chatMessageTable.sentAt),
      ),
    );
    return Result.ok('Fetched notification count', res);
  }

  async updateLastSeen(userId: number) {
    await this.db
      .update(userTable)
      .set({ notificationLastSeenAt: sql`(now())` })
      .where(eq(userTable.id, userId));
  }
}
