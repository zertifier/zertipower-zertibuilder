import { Transform } from 'class-transformer';
import { IsOptional, IsDefined } from 'class-validator';
import * as moment from 'moment';
import {ApiProperty} from "@nestjs/swagger";

export class SaveProposalsOptionsDTO {
  @ApiProperty({ required: false })
  @IsOptional()
  proposalId: number;
  @ApiProperty({ required: false })
  @IsOptional()
  option: string;
}
