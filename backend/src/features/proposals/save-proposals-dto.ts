import { Transform } from 'class-transformer';
import { IsOptional, IsDefined } from 'class-validator';
import * as moment from 'moment';
import {ApiProperty} from "@nestjs/swagger";

export class SaveProposalsDTO {
  @ApiProperty({ required: false })
  @IsOptional()
  proposal: string;
  @ApiProperty({ required: false })
  @IsOptional()
  description: string;
  @ApiProperty({ required: false })
  @IsOptional()
  userId: number;
  @ApiProperty({ required: false })
  @IsOptional()
  communityId: number;

  @ApiProperty({ required: false })
  @Transform((value) =>
    moment.utc((value as any).value, 'YYYY-MM-DD HH:mm:ss').toDate(),
  )
  @IsOptional()
  expirationDt: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => (value as string).toUpperCase())
  status: string;

  @ApiProperty({ required: false })
  @IsOptional()
  quorum: number;
  @ApiProperty({ required: false })
  @IsOptional()
  transparent: number;
  @ApiProperty({ required: false })
  @IsOptional()
  type: string;
}
