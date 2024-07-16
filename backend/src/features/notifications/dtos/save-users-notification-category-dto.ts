import { Transform } from 'class-transformer';
import { IsOptional, IsDefined } from 'class-validator';
import * as moment from 'moment';
import { ApiProperty } from '@nestjs/swagger';

export class SaveUsersNotificationCategoryDTO {
  @ApiProperty({ required: false })
  @IsOptional()
  userId: number;

  @ApiProperty({ required: false })
  @IsOptional()
  notificationCategoryId: number;

  @ApiProperty({ required: false })
  @IsOptional()
  active: number;

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
