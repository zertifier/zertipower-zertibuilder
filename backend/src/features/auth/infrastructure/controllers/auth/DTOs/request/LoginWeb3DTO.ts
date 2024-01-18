import { IsEthereumAddress, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginWeb3DTO {
  @ApiProperty()
  @IsEthereumAddress()
  wallet_address: string;
  @ApiProperty()
  @IsNotEmpty()
  signature: string;
}
