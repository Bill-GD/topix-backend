import { ApiController, RequesterID } from '@/common/decorators';
import { AuthenticatedGuard, GetRequesterGuard } from '@/common/guards';
import { CommonQuery } from '@/common/queries/common.query';
import { ControllerResponse } from '@/common/utils/controller-response';
import { addPaginateHeader } from '@/common/utils/helpers';
import { SSEMessageEvent } from '@/common/utils/types';
import { EventService } from '@/modules/notification/event.service';
import {
  Controller,
  Get,
  HttpStatus,
  Query,
  Res,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { NotificationService } from './notification.service';

@Controller('notification')
@ApiController()
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly eventService: EventService,
  ) {}

  @Get()
  @UseGuards(AuthenticatedGuard, GetRequesterGuard)
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
  @UseGuards(AuthenticatedGuard, GetRequesterGuard)
  async getCount(@RequesterID() requesterId: number) {
    const res = await this.notificationService.count(requesterId);
    return ControllerResponse.ok(res.message, res.data, HttpStatus.OK);
  }

  @Sse('sse')
  notifyUsers(): Observable<SSEMessageEvent> {
    return this.eventService.stream;
  }
}
