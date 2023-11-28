import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestResetPasswordDTO {
  @ApiProperty()
  @IsEmail()
  email: string;
}
