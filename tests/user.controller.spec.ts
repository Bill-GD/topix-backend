import { DatabaseModule } from '@/modules/database.module';
import { UserController } from '@/modules/user/user.controller';
import { UserService } from '@/modules/user/user.service';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;
  // const loginGuard = UserExistGuard(true, ['username']);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [UserService, JwtService],
      imports: [DatabaseModule],
    })
      // .overrideGuard(loginGuard)
      // .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get(UserController);
    service = module.get(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  afterEach(() => jest.clearAllMocks());
});
