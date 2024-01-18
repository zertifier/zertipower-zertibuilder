import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class RequestSaveRoleDTO {
  @ApiProperty()
  @IsNotEmpty()
  name: string;
}
