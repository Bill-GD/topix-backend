import { ControllerResponse } from '@/common/utils/controller-response';
import {
  applyDecorators,
  BadRequestException,
  createParamDecorator,
  SetMetadata,
  Type,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { Request } from 'express';
import { Socket } from 'socket.io';

export const DecoratorKeys = {
  userExistCheck: 'UserExistConfig',
  accountExistCheck: 'AccountExistConfig',
} as const;

export function ApiController(...extraMimeTypes: string[]) {
  return applyDecorators(
    ApiConsumes('application/json', ...extraMimeTypes),
    ApiResponse({ type: ControllerResponse }),
  );
}

export function ApiFile(
  fieldname: string,
  dtoType: Type,
  accepts: 'single' | 'list',
) {
  return applyDecorators(
    ApiConsumes('multipart/form-data'),
    ApiResponse({ type: ControllerResponse }),
    ApiBody({ type: dtoType }),
    accepts === 'single'
      ? UseInterceptors(FileInterceptor(fieldname))
      : UseInterceptors(FilesInterceptor(fieldname)),
  );
}

export const RequesterID = createParamDecorator((data, context) => {
  const req = context.switchToHttp().getRequest<Request>();
  if (!req.userId) {
    throw new BadRequestException('No user ID found in request');
  }
  return req.userId;
});

export const WsRequesterID = createParamDecorator((data, context) => {
  const client = context.switchToWs().getClient<Socket>();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (!client.data.userId) {
    throw new BadRequestException('No user ID found in WS event');
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return client.data.userId as number;
});

export const UserExist = (config: { check: 'id' | 'username' }) =>
  SetMetadata(DecoratorKeys.userExistCheck, config.check);

export const AccountInfo = (config: {
  shouldExist: boolean;
  checks: ('email' | 'username')[];
}) => SetMetadata(DecoratorKeys.accountExistCheck, config);

export function IsNotEmptyString() {
  return applyDecorators(IsString(), IsNotEmpty());
}

export function IsPositiveNumber() {
  return applyDecorators(IsPositive(), IsNumber());
}

export function IsOptionalString() {
  return applyDecorators(IsString(), IsOptional());
}
