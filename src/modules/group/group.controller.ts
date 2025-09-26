import { ApiController, ApiFile, RequesterID } from '@/common/decorators';
import { AuthenticatedGuard, GetRequesterGuard } from '@/common/guards';
import { ControllerResponse } from '@/common/utils/controller-response';
import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpStatus,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupService } from './group.service';

@Controller('group')
@UseGuards(AuthenticatedGuard)
@ApiController()
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post()
  @UseGuards(GetRequesterGuard)
  @ApiFile('banner', CreateGroupDto, 'single')
  async createThread(
    @RequesterID() requesterId: number,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({
            fileType: 'image/*',
            fallbackToMimetype: true,
          }),
        ],
        fileIsRequired: false,
      }),
    )
    banner: Express.Multer.File,
    @Body() dto: CreateGroupDto,
  ) {
    if (banner) dto.bannerFile = banner;
    const res = await this.groupService.create(dto, requesterId);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.CREATED);
  }

  @Get()
  findAll() {
    return this.groupService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.groupService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGroupDto) {
    return this.groupService.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.groupService.remove(+id);
  }
}
