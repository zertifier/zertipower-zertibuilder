import { ApiProperty } from "@nestjs/swagger";
import { Permission } from "../../../../domain/permissions/Permission";
import { IsNotEmpty } from "class-validator";

export class PermissionDTO {
  @ApiProperty()
  @IsNotEmpty()
  resource: string;
  @ApiProperty()
  @IsNotEmpty()
  action: string;
  @ApiProperty()
  @IsNotEmpty()
  role: string;
  @ApiProperty()
  @IsNotEmpty()
  allow: boolean;
}

export class PermissionsDTOMapper {
  public static toDTO(permission: Permission): PermissionDTO {
    const dto = new PermissionDTO();
    dto.action = permission.action;
    dto.role = permission.role.name;
    dto.resource = permission.resource;
    dto.allow = permission.allow;
    return dto;
  }
}
