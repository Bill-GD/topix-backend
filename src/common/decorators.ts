import { ControllerResponse } from '@/common/utils/controller-response';
import { applyDecorators, Type, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { StorageEngine } from 'multer';

/**
 * Applies several Swagger decorators.
 * @param extraMimeTypes Add more mime types. Consumes `application/json` by default.
 */
export function ApiController(...extraMimeTypes: string[]) {
  return applyDecorators(
    ApiConsumes('application/json', ...extraMimeTypes),
    ApiResponse({ type: ControllerResponse }),
  );
}

export function ApiFile(
  fieldname: string,
  dtoType: Type,
  storage?: StorageEngine,
) {
  return applyDecorators(
    ApiConsumes('multipart/form-data'),
    ApiResponse({ type: ControllerResponse }),
    ApiBody({ type: dtoType }),
    UseInterceptors(FileInterceptor(fieldname, { storage })),
  );
}

export function IsNotEmptyString() {
  return applyDecorators(IsString(), IsNotEmpty());
}

export function IsOptionalString() {
  return applyDecorators(IsString(), IsOptional());
}
