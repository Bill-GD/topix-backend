import { SSEMessageEvent } from '@/common/utils/types';
import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

@Injectable()
export class EventService {
  private eventStream = new Subject<SSEMessageEvent>();

  get stream() {
    return this.eventStream.asObservable();
  }

  emit(data: string | object) {
    this.eventStream.next({ data });
  }
}
