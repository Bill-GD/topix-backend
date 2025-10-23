import { ApiController, RequesterID } from '@/common/decorators';
import { AuthenticatedGuard, GetRequesterGuard } from '@/common/guards';
import { ChatQuery } from '@/common/queries';
import { ControllerResponse } from '@/common/utils/controller-response';
import { addPaginateHeader } from '@/common/utils/helpers';
import { ChatService } from '@/modules/chat/chat.service';
import { CreateChatChannelDto } from '@/modules/chat/dto/create-chat-channel.dto';
import {
  Body,
  Controller,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';

@Controller('chat')
@UseGuards(AuthenticatedGuard, GetRequesterGuard)
@ApiController()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('channel')
  async createChannel(
    @RequesterID() requesterId: number,
    @Body() dto: CreateChatChannelDto,
  ) {
    const res = await this.chatService.createChannel(dto, requesterId);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.CREATED);
  }

  @Get()
  async getAll(
    @Res({ passthrough: true }) response: Response,
    @Query() query: ChatQuery,
    @RequesterID() requesterId: number,
  ) {
    const res = await this.chatService.getAll(query, requesterId);
    addPaginateHeader(response, res.data.length < query.size);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  @Get(':id')
  async getChannel(@Param('id', ParseIntPipe) channelId: number) {
    const res = await this.chatService.getChannel(channelId);
    if (!res.success) {
      return ControllerResponse.fail(new NotFoundException(res.message));
    }
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  // // unused
  // @Get(':id/join-status')
  // async getJoinStatus(
  //   @Param('id', ParseIntPipe) groupId: number,
  //   @RequesterID() requesterId: number,
  // ) {
  //   const res = await this.chatService.getJoinStatus(groupId, requesterId);
  //   return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  // }
  //
  // @Get(':id/tags')
  // async getAllTags(@Param('id', ParseIntPipe) groupId: number) {
  //   const res = await this.chatService.getAllTags(groupId);
  //   return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  // }
  //
  // @Get(':id/members')
  // @UseGuards(GroupExistGuard)
  // async getAllMembers(
  //   @Res({ passthrough: true }) response: Response,
  //   @Query() query: MemberQuery,
  //   @Param('id', ParseIntPipe) groupId: number,
  // ) {
  //   const res = await this.chatService.getAllMembers(groupId, query);
  //   addPaginateHeader(response, res.data.length < query.size);
  //   return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  // }
  //
  // @Post(':id/join')
  // @UseGuards(GroupExistGuard)
  // async joinGroup(
  //   @Param('id', ParseIntPipe) groupId: number,
  //   @RequesterID() requesterId: number,
  // ) {
  //   const res = await this.chatService.joinGroup(groupId, requesterId);
  //   return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  // }
  //
  // @Post(':id/post')
  // @UseGuards(GroupExistGuard)
  // @ApiFile('files', CreatePostDto, 'list')
  // async addPost(
  //   @Param('id', ParseIntPipe) groupId: number,
  //   @RequesterID() requesterId: number,
  //   @UploadedFiles(
  //     new ParseFilePipe({
  //       validators: [
  //         new FileTypeValidator({
  //           fileType: '(image|video)/*',
  //           fallbackToMimetype: true,
  //         }),
  //       ],
  //       fileIsRequired: false,
  //     }),
  //     new FileSizeValidatorPipe(),
  //   )
  //   files: Array<Express.Multer.File>,
  //   @Body() dto: CreatePostDto,
  // ) {
  //   if (files) dto.fileObjects = files;
  //   const res = await this.chatService.addPost(groupId, requesterId, dto);
  //   return ControllerResponse.ok(res.message, res.data, HttpStatus.CREATED);
  // }
  //
  // @Post(':id/thread')
  // @UseGuards(GroupExistGuard)
  // async addThread(
  //   @Param('id', ParseIntPipe) groupId: number,
  //   @RequesterID() requesterId: number,
  //   @Body() dto: CreateThreadDto,
  // ) {
  //   const res = await this.chatService.addThread(groupId, requesterId, dto);
  //   return ControllerResponse.ok(res.message, res.data, HttpStatus.CREATED);
  // }
  //
  // @Post(':id/tag')
  // @UseGuards(GroupExistGuard, GroupOwnerGuard)
  // async addTag(
  //   @Param('id', ParseIntPipe) groupId: number,
  //   @Body() dto: CreateTagDto,
  // ) {
  //   const res = await this.chatService.addTag(groupId, dto);
  //   return ControllerResponse.ok(res.message, res.data, HttpStatus.CREATED);
  // }
  //
  // @Post(':id/change-owner')
  // @UseGuards(GroupExistGuard, GroupOwnerGuard)
  // async changeOwner(
  //   @Param('id', ParseIntPipe) groupId: number,
  //   @Body() dto: { newOwnerId: number },
  // ) {
  //   const res = await this.chatService.changeOwner(groupId, dto.newOwnerId);
  //   return ControllerResponse.ok(res.message, res.data, HttpStatus.CREATED);
  // }
  //
  // @Post(':id/member/:userId')
  // @UseGuards(GroupExistGuard, GroupOwnerGuard)
  // async acceptMember(
  //   @Param('id', ParseIntPipe) groupId: number,
  //   @Param('userId', ParseIntPipe) userId: number,
  // ) {
  //   const res = await this.chatService.acceptMember(groupId, userId);
  //   return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  // }
  //
  // @Post(':id/post/:postId')
  // @UseGuards(GroupExistGuard, GroupOwnerGuard)
  // async acceptPost(@Param('postId', ParseIntPipe) postId: number) {
  //   const res = await this.chatService.acceptPost(postId);
  //   return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  // }
  //
  // @Patch(':id')
  // @ApiFile('banner', UpdateGroupDto, 'single')
  // @UseGuards(GroupExistGuard, GroupOwnerGuard)
  // async update(
  //   @Param('id', ParseIntPipe) groupId: number,
  //   @UploadedFile(
  //     new ParseFilePipe({
  //       validators: [
  //         new FileTypeValidator({
  //           fileType: 'image/*',
  //           fallbackToMimetype: true,
  //         }),
  //       ],
  //       fileIsRequired: false,
  //     }),
  //   )
  //   banner: Express.Multer.File,
  //   @Body() dto: UpdateGroupDto,
  // ) {
  //   if (banner) dto.bannerFile = banner;
  //   const res = await this.chatService.update(groupId, dto);
  //   return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  // }
  //
  // @Delete(':id/member')
  // @UseGuards(GroupExistGuard)
  // async leaveGroup(
  //   @Param('id', ParseIntPipe) groupId: number,
  //   @RequesterID() requesterId: number,
  // ) {
  //   const res = await this.chatService.removeMember(groupId, requesterId);
  //   return ControllerResponse.ok(
  //     'Left group successfully.',
  //     res.data,
  //     HttpStatus.OK,
  //   );
  // }
  //
  // @Delete(':id/tag/:tagId')
  // @UseGuards(GroupExistGuard, GroupOwnerGuard, TagExistGuard)
  // async removeTag(@Param('tagId', ParseIntPipe) tagId: number) {
  //   const res = await this.chatService.removeTag(tagId);
  //   return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  // }
  //
  // @Delete(':id/member/:userId')
  // @UseGuards(GroupExistGuard, GroupOwnerGuard)
  // async deleteMember(
  //   @Param('id', ParseIntPipe) groupId: number,
  //   @Param('userId', ParseIntPipe) userId: number,
  // ) {
  //   const res = await this.chatService.removeMember(groupId, userId);
  //   return ControllerResponse.ok(res.message, res.data, HttpStatus.CREATED);
  // }
  //
  // @Delete(':id')
  // @UseGuards(GroupExistGuard, GroupOwnerGuard)
  // async remove(@Param('id', ParseIntPipe) groupId: number) {
  //   const res = await this.chatService.remove(groupId);
  //   return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  // }
}
