import { Transform } from 'class-transformer';
import { IsOptional, IsDefined } from 'class-validator';
import * as moment from 'moment';
import {ApiProperty} from "@nestjs/swagger";

export class SaveVotesDTO {
  @ApiProperty({ required: false })
  @IsOptional()
  proposalId: number;
  @ApiProperty({ required: false })
  @IsOptional()
  userId: number;
  @ApiProperty({ required: false })
  @IsOptional()
  optionId: number;
}
