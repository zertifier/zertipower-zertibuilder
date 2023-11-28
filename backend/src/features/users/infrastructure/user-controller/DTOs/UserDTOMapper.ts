import { User } from '../../../domain/User';
import { UserDTO } from './UserDTO';

export class UserDTOMapper {
  public static toDto(user: User): UserDTO {
    const {
      id,
      firstname,
      role,
      username,
      email,
      lastname,
      wallet_address,
      created_at,
      updated_at,
    } = user.serialize();
    return {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      id: id!,
      firstname,
      role: role.name,
      username,
      email,
      lastname,
      wallet_address,
      created_at,
      updated_at,
    };
  }
}
