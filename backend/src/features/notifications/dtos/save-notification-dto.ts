import { Transform } from 'class-transformer';
import { IsOptional, IsDefined } from 'class-validator';
import * as moment from 'moment';
import { ApiProperty } from '@nestjs/swagger';

export class SaveNotificationDTO {
  @ApiProperty({ required: false })
  @IsOptional()
  notificationCategoryId: number;

  @ApiProperty({ required: false })
  @IsOptional()
  notification: string;

  @ApiProperty({ required: false })
  @IsOptional()
  code: string;

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
