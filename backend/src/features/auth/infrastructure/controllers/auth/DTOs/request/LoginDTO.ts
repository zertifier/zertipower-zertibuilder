import { IsDefined, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDTO {
  @ApiProperty()
  @IsNotEmpty()
  user: string;

  @ApiProperty()
  @IsDefined()
  password: string;
}
