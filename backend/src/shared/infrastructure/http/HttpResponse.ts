import { ErrorCode } from "../../domain/error";
import { InvalidArgumentError } from "../../domain/error/common";
import { ApiProperty } from "@nestjs/swagger";

export class HttpResponse {
  @ApiProperty()
  public readonly success: boolean;
  @ApiProperty({ required: false })
  public data?: any;
  @ApiProperty()
  public readonly message: string;
  @ApiProperty({ required: false })
  public readonly error_code?: string;

  constructor(payload: {
    success: boolean;
    data?: any;
    message: string;
    error_code?: ErrorCode;
  }) {
    const { message, data, error_code, success } = payload;
    if (!success && !error_code) {
      throw new InvalidArgumentError(
        "Error code must be defined when it's not a successful response"
      );
    }
    this.success = success;
    this.data = data;
    this.message = message;
    this.error_code = error_code;
  }

  public static success(message: string): HttpResponse {
    return new HttpResponse({ success: true, message });
  }

  public static failure(message: string, errorCode: ErrorCode): HttpResponse {
    return new HttpResponse({
      success: false,
      message,
      error_code: errorCode,
    });
  }

  withData(data: any): HttpResponse {
    this.data = data;
    return this;
  }
}
