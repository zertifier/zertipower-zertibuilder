import { ApiProperty } from "@nestjs/swagger";
import { UserRole } from "../../../../domain/UserRole";

export class RoleDTO {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;
}

export class UserRoleDTOMapper {
  public static toDTO(role: UserRole): RoleDTO {
    const roleDTO = new RoleDTO();
    const { id, name } = role.serialize();
    roleDTO.id = id;
    roleDTO.name = name;
    return roleDTO;
  }
  public static toRole(roleDTO: RoleDTO): UserRole {
    return new UserRole({ name: roleDTO.name }).withId(roleDTO.id);
  }
}
