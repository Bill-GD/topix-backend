import 'express';
import { UserRoles } from '@/common/utils/types';

declare module 'express' {
  interface Request {
    userId?: number;
    userRole?: keyof typeof UserRoles;
  }
}
