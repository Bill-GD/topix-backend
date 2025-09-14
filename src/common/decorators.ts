import { ControllerResponse } from '@/common/utils/controller-response';
import { applyDecorators, Type, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

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

export function ApiFile(fieldname: string, dtoType: Type) {
  return applyDecorators(
    ApiConsumes('multipart/form-data'),
    ApiResponse({ type: ControllerResponse }),
    ApiBody({ type: dtoType }),
    UseInterceptors(FilesInterceptor(fieldname)),
  );
}

export function IsNotEmptyString() {
  return applyDecorators(IsString(), IsNotEmpty());
}

export function IsPositiveNumber() {
  return applyDecorators(IsPositive(), IsNumber());
}

export function IsOptionalString() {
  return applyDecorators(IsString(), IsOptional());
}
