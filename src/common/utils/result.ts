export class Result {
  success: boolean;
  message: string;

  private constructor(success: boolean, message: string) {
    this.success = success;
    this.message = message;
  }

  static ok(message: string) {
    return new Result(true, message);
  }

  static fail(message: string) {
    return new Result(false, message);
  }
}
