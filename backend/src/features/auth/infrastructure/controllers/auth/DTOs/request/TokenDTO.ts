import { IsJWT } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class TokenDTO {
  @ApiProperty()
  @IsJWT()
  token: string;
}
