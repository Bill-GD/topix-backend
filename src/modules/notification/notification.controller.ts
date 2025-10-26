import { ApiController, RequesterID } from '@/common/decorators';
import { AuthenticatedGuard, GetRequesterGuard } from '@/common/guards';
import { CommonQuery } from '@/common/queries/common.query';
import { ControllerResponse } from '@/common/utils/controller-response';
import { addPaginateHeader } from '@/common/utils/helpers';
import {
  Controller,
  Get,
  HttpStatus,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { NotificationService } from './notification.service';

@Controller('notification')
@UseGuards(AuthenticatedGuard, GetRequesterGuard)
@ApiController()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getAll(
    @Res({ passthrough: true }) response: Response,
    @Query() query: CommonQuery,
    @RequesterID() requesterId: number,
  ) {
    const res = await this.notificationService.getAll(query, requesterId);
    if (query.page === 1) {
      await this.notificationService.updateLastSeen(requesterId);
    }
    addPaginateHeader(response, res.data.length < query.size);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  @Get('count')
  async getCount(@RequesterID() requesterId: number) {
    const res = await this.notificationService.count(requesterId);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }
}
