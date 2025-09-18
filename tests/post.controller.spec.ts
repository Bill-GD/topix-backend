import { AuthenticatedGuard } from '@/common/guards';
import { Result } from '@/common/utils/result';
import { DatabaseModule } from '@/modules/database.module';
import { CreatePostDto } from '@/modules/post/dto/create-post.dto';
import { PostController } from '@/modules/post/post.controller';
import { PostService } from '@/modules/post/post.service';
import { NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

describe('PostController', () => {
  let controller: PostController;
  let service: PostService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostController],
      providers: [PostService, JwtService],
      imports: [DatabaseModule],
    })
      .overrideGuard(AuthenticatedGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get(PostController);
    service = module.get(PostService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  it('should return 201 after uploading post', async () => {
    const func = jest
      .spyOn(service, 'create')
      .mockResolvedValue(Result.ok('Success', 1));
    const dto: CreatePostDto = {
      content: '',
      type: 'image',
    };
    const res = await controller.create(1, dto);
    expect(res.success).toBe(true);
    expect(res.status).toBe(201);
    expect(res.message).toBe('Success');
    expect(func).toHaveBeenCalledWith(1, dto);
  });

  it(`should throw NotFoundException if post doesn't exist`, async () => {
    const func = jest
      .spyOn(service, 'findOne')
      // @ts-expect-error the normal only return ok, but mock returns failure to test
      .mockResolvedValue(Result.fail('Fail'));
    await expect(controller.findOne(-1111, 1)).rejects.toThrow(
      NotFoundException,
    );
    expect(func).toHaveBeenCalled();
  });
});
