import { ControllerResponse } from '@/common/utils/controller-response';
import { applyDecorators } from '@nestjs/common';
import { ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

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

export function IsNotEmptyString() {
  return applyDecorators(IsString(), IsNotEmpty());
}

export function IsOptionalString() {
  return applyDecorators(IsString(), IsOptional());
}
