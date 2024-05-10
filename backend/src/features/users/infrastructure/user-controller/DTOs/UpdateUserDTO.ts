import {
  IsEmail,
  IsEthereumAddress,
  IsNotEmpty,
  IsNumber,
  IsOptional,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateUserDTO {
  @ApiProperty()
  @IsNotEmpty()
  username: string;

  @ApiProperty()
  @IsNotEmpty()
  firstname: string;

  @ApiProperty()
  @IsNotEmpty()
  lastname: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsNumber()
  customer_id: number;

  @ApiProperty()
  @IsOptional()
  password: string;

  @ApiProperty()
  @IsNotEmpty()
  role: string;

  @ApiProperty()
  @IsOptional()
  @IsEthereumAddress()
  wallet_address?: string;
}
