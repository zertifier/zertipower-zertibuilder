import { IsEthereumAddress } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RequestCodeDTO {
  @ApiProperty()
  @IsEthereumAddress()
  wallet_address: string;
}
