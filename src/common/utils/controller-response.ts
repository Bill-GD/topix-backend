import { HttpException, HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class ControllerResponse<T = null> {
  @ApiProperty({ type: 'boolean' })
  readonly success: boolean;

  @ApiProperty({ type: 'string' })
  readonly message: string;

  @ApiProperty({ type: 'number', example: 200 })
  readonly status: number;

  @ApiProperty()
  readonly error: string | object | null;

  @ApiProperty()
  readonly data: T;

  private constructor(
    success: boolean,
    message: string,
    status: number,
    data: T,
    error: string | object | null,
  ) {
    this.message = message;
    this.data = data;
    this.error = error;
    this.status = status;
    this.success = success;
  }

  static ok<T>(message: string, data: T, status: HttpStatus) {
    return new ControllerResponse(true, message, status, data, null);
  }

  static fail(error: HttpException) {
    const res = error.getResponse();

    return new ControllerResponse(
      false,
      error.message,
      error.getStatus(),
      null,
      typeof res === 'string' ? res : res['message'],
    );
  }
}
