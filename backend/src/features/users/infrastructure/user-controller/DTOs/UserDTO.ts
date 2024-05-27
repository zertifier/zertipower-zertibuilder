import { ApiProperty } from "@nestjs/swagger";

export class UserDTO {
  @ApiProperty()
  id: number;
  @ApiProperty()
  username: string;
  @ApiProperty()
  firstname: string;
  @ApiProperty()
  lastname: string;
  @ApiProperty()
  email: string;
  @ApiProperty()
  customer_id?: number;
  @ApiProperty()
  created_at: number;
  @ApiProperty()
  updated_at: number;
  @ApiProperty()
  role: string;
  @ApiProperty()
  wallet_address?: string;
}
