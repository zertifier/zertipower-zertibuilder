import { Transform } from 'class-transformer';
import { IsOptional, IsDefined } from 'class-validator';
import * as moment from 'moment';
import {ApiProperty} from "@nestjs/swagger";

export class SaveResponsesDTO {
  @ApiProperty({ required: false })
  @IsOptional()
  proposalId: number;
  @ApiProperty({ required: false })
  @IsOptional()
  proposalOptionId: number;
  @ApiProperty({ required: false })
  @IsOptional()
  userId: number;
}
