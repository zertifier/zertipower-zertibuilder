import { ApiProperty } from '@nestjs/swagger';

export class LoggedInDTO {
  @ApiProperty()
  access_token: string;
  @ApiProperty()
  refresh_token: string;

  constructor(accessToken: string, refreshToken: string) {
    this.access_token = accessToken;
    this.refresh_token = refreshToken;
  }
}
