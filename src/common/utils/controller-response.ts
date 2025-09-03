import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class ControllerResponse<T = null> {
  @ApiProperty({ type: 'string' })
  readonly message: string;

  @ApiProperty({ type: 'number', example: 200 })
  readonly status: number;

  @ApiProperty({ type: 'string' })
  readonly error: string | null;

  @ApiProperty()
  readonly data: T;

  private constructor(
    message: string,
    data: T,
    status: number,
    error: string | null,
  ) {
    this.message = message;
    this.data = data;
    this.error = error;
    this.status = status;
  }

  static ok<T>(message: string, data: T, status: HttpStatus = HttpStatus.OK) {
    return new ControllerResponse(message, data, status, null);
  }

  static fail(
    message: string,
    error: Error,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    return new ControllerResponse(message, null, status, error.name);
  }
}
