import { ApiProperty } from "@nestjs/swagger";

export class TokenRefreshedDTO {
  @ApiProperty()
  access_token: string;

  constructor(accessToken: string) {
    this.access_token = accessToken;
  }
}
