import { DatabaseProviderKey } from '@/common/utils/constants';
import { Result } from '@/common/utils/result';
import { DBType } from '@/common/utils/types';
import { profileTable, userTable } from '@/database/schemas';
import { UpdateProfileDto } from '@/modules/user/dto/update-profile.dto';
import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

@Injectable()
export class UserService {
  constructor(@Inject(DatabaseProviderKey) private readonly db: DBType) {}

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

  async updateProfileInfo(dto: UpdateProfileDto): Promise<Result<null>> {
    return Result.ok('Success', null);
  }

  async deleteUser(username: string): Promise<Result<null>> {
    return Result.ok('Success', null);
  }
}
