import { Result } from '@/common/utils/result';
import { DatabaseModule } from '@/modules/database.module';
import { PostModule } from '@/modules/post/post.module';
import { UserController } from '@/modules/user/user.controller';
import { UserService } from '@/modules/user/user.service';
import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [UserService, JwtService],
      imports: [DatabaseModule, PostModule],
    }).compile();

    controller = module.get(UserController);
    service = module.get(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  it(`should throw ConflictException when trying to update to an existing username`, async () => {
    jest
      .spyOn(service, 'updateProfileInfo')
      .mockResolvedValue(Result.fail('Fail'));

    await expect(
      controller.updateProfile(1, {
        username: 'existing-name',
      }),
    ).rejects.toThrow(ConflictException);
  });

  afterEach(() => jest.clearAllMocks());
});
