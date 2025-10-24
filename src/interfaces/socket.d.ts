import 'socket.io';
import { UserRoles } from '@/common/utils/types';

declare module 'socket.io' {
  interface Socket {
    data: {
      userId?: number;
      userRole?: keyof typeof UserRoles;
    };
  }
}
