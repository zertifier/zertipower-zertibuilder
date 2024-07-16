import { Transform } from 'class-transformer';
import { IsOptional, IsDefined } from 'class-validator';
import * as moment from 'moment';
import { ApiProperty } from '@nestjs/swagger';

export class SaveUsersNotificationHistoricDTO {
  @ApiProperty({ required: false })
  @IsOptional()
  userId: number;

  @ApiProperty({ required: false })
  @IsOptional()
  notificationId: number;

  @ApiProperty({ required: false })
  @IsOptional()
  email: string;

  @ApiProperty({ required: false })
  @IsOptional()
  subject: string;

  @ApiProperty({ required: false })
  @Transform((value) =>
    moment.utc((value as any).value, 'YYYY-MM-DD HH:mm:ss').toDate(),
  )
  @IsOptional()
  createdDt: Date;

  @ApiProperty({ required: false })
  @Transform((value) =>
    moment.utc((value as any).value, 'YYYY-MM-DD HH:mm:ss').toDate(),
  )
  @IsOptional()
  updatedDt: Date;
}
