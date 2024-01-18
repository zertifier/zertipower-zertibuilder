import { PermissionDTO } from "./PermissionsDTO";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { ArrayNotEmpty, ValidateNested } from "class-validator";

export class RequestSavePermissionDTO {
  @ApiProperty({ type: () => [PermissionDTO] })
  @Type(() => PermissionDTO)
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  permissions: Array<PermissionDTO>;
}
