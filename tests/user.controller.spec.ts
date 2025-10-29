import { Result } from '@/common/utils/result';
import { CloudinaryModule } from '@/modules/cloudinary.module';
import { DatabaseModule } from '@/modules/database.module';
import { FileService } from '@/modules/file/file.service';
import { NotificationModule } from '@/modules/notification/notification.module';
import { UserController } from '@/modules/user/user.controller';
import { UserService } from '@/modules/user/user.service';
import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Readable } from 'stream';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test.png',
    encoding: '7bit',
    mimetype: 'image/png',
    size: 1024,
    destination: '/tmp',
    filename: 'test.png',
    path: '/tmp/test.png',
    buffer: Buffer.from('fake-image-data'),
    stream: Readable.from(Buffer.from('fake-image-data')),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [UserService, JwtService, FileService],
      imports: [DatabaseModule, CloudinaryModule, NotificationModule],
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
      controller.updateProfile(1, mockFile, {
        username: 'existing-name',
      }),
    ).rejects.toThrow(ConflictException);
  });

  afterEach(() => jest.clearAllMocks());
});
