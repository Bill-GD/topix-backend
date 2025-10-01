import { UserQuery } from '@/common/queries';
import { DatabaseProviderKey } from '@/common/utils/constants';
import { Result } from '@/common/utils/result';
import { DBType } from '@/common/utils/types';
import {
  groupMemberTable,
  mediaTable,
  postTable,
  profileTable,
  userTable,
} from '@/database/schemas';
import { FileService } from '@/modules/file/file.service';
import { UpdateProfileDto } from '@/modules/user/dto/update-profile.dto';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull, SQL } from 'drizzle-orm';

@Injectable()
export class UserService {
  constructor(
    @Inject(DatabaseProviderKey) private readonly db: DBType,
    private readonly fileService: FileService,
  ) {}

  async getUsers(userQuery: UserQuery) {
    const andQueries: SQL[] = [];

    if (userQuery.groupId) {
      andQueries.push(eq(groupMemberTable.groupId, userQuery.groupId));
      if (userQuery.accepted !== undefined) {
        andQueries.push(eq(groupMemberTable.accepted, userQuery.accepted));
      }
    } else {
      andQueries.push(isNull(groupMemberTable.groupId));
    }

    const users = await this.db
      .select({
        id: userTable.id,
        username: userTable.username,
        displayName: profileTable.displayName,
        profilePicture: profileTable.profilePicture,
        role: userTable.role,
      })
      .from(userTable)
      .innerJoin(profileTable, eq(userTable.id, profileTable.userId))
      .leftJoin(groupMemberTable, eq(userTable.id, groupMemberTable.userId))
      .where(and(...andQueries))
      .limit(userQuery.limit)
      .offset(userQuery.offset);

    return Result.ok('Fetched users successfully.', users);
  }

  async getUserById(id: number) {
    const [user] = await this.db
      .select({
        id: userTable.id,
        username: userTable.username,
        displayName: profileTable.displayName,
        profilePicture: profileTable.profilePicture,
        role: userTable.role,
      })
      .from(userTable)
      .innerJoin(profileTable, eq(userTable.id, profileTable.userId))
      .where(eq(userTable.id, id));

    return user;
  }

  async getUserByUsername(username: string) {
    const [user] = await this.db
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
      .where(eq(userTable.username, username));

    return user;
  }

  async updateProfileInfo(
    id: number,
    dto: UpdateProfileDto,
  ): Promise<Result<null>> {
    const user = await this.getUserById(id);

    if (dto.username && user.username !== dto.username) {
      const count = await this.db.$count(
        userTable,
        eq(userTable.username, dto.username),
      );

      if (count >= 1) {
        return Result.fail('Username is already taken.');
      }

      await this.db
        .update(userTable)
        .set({ username: dto.username })
        .where(eq(userTable.id, id));
    } else {
      await this.db
        .update(profileTable)
        .set({
          displayName: dto.displayName,
          description: dto.description,
          profilePicture: dto.profilePicture,
        })
        .where(eq(profileTable.userId, id));
    }

    return Result.ok('Updated user profile successfully.', null);
  }

  async deleteUser(username: string): Promise<Result<null>> {
    const user = await this.getUserByUsername(username);
    if (user.role === 'admin') {
      return Result.fail(`Admin account can't be deleted.`);
    }

    const posts = await this.db
      .select({
        media: {
          id: mediaTable.id,
          type: mediaTable.type,
        },
      })
      .from(postTable)
      .leftJoin(mediaTable, eq(mediaTable.postId, postTable.id))
      .where(eq(postTable.ownerId, user.id));

    this.fileService.remove(
      posts
        .filter((e) => e.media !== null)
        .map((e) => ({ publicId: e.media!.id, type: e.media!.type })),
    );

    await this.db.delete(userTable).where(eq(userTable.id, user.id));
    return Result.ok('Deleted account successfully.', null);
  }
}
