import { Transform } from "class-transformer";
import { IsOptional, IsDefined } from "class-validator";
import * as moment from "moment";
import {ApiProperty} from "@nestjs/swagger";

export class SaveEnergyTransactionsDTO {
  @IsOptional()
  id: number;

  @ApiProperty({ required: false })
  @IsOptional()
  cupsId: number;

  @Transform((value) =>
    moment.utc((value as any).value, "YYYY-MM-DD HH:mm:ss").toDate()
  )
  @ApiProperty({ required: false })
  @IsOptional()
  infoDt: Date;

  @IsOptional()
  type: string;

  @ApiProperty({ required: false })
  @IsOptional()
  kwhIn: number;

  @ApiProperty({ required: false })
  @IsOptional()
  kwhOut: number;

  @ApiProperty({ required: false })
  @IsOptional()
  kwhOutVirtual: number;

  @ApiProperty({ required: false })
  @IsOptional()
  kwhInPrice: number;

  @ApiProperty({ required: false })
  @IsOptional()
  kwhOutPrice: number;

  @ApiProperty({ required: false })
  @IsOptional()
  kwhInPriceCommunity: number;

  @ApiProperty({ required: false })
  @IsOptional()
  kwhOutPriceCommunity: number;

  @ApiProperty({ required: false })
  @IsOptional()
  kwhSurplus: number;

  @ApiProperty({ required: false })
  @IsOptional()
  blockId: number;

  @Transform((value) =>
    moment.utc((value as any).value, "YYYY-MM-DD HH:mm:ss").toDate()
  )
  @IsOptional()
  createdAt: Date;
  @Transform((value) =>
    moment.utc((value as any).value, "YYYY-MM-DD HH:mm:ss").toDate()
  )
  @IsOptional()
  updatedAt: Date;
}
