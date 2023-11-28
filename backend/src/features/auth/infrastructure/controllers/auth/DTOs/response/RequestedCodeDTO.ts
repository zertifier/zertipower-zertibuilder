import { ApiProperty } from '@nestjs/swagger';

export class RequestedCodeDTO {
  @ApiProperty()
  code: string;

  constructor(code: string) {
    this.code = code;
  }
}
