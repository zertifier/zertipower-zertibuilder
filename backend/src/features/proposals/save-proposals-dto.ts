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
  communityId: number;
  @ApiProperty({ required: false })
  @Transform((value) =>
    moment.utc((value as any).value, 'YYYY-MM-DD HH:mm:ss').toDate(),
  )
  @IsOptional()
  expirationDt: Date;
  @ApiProperty({ required: false })
  @IsOptional()
  status: string;
  @ApiProperty({ required: false })
  @IsOptional()
  daoId: number;
}
