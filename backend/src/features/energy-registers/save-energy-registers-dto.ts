import {Transform} from "class-transformer";
import {IsOptional, IsDefined} from "class-validator";
import * as moment from "moment";
import {ApiProperty} from "@nestjs/swagger";

export class SaveEnergyRegistersDTO {
  @IsOptional()
  id: number;

  @Transform((value) =>
    moment.utc((value as any).value, "YYYY-MM-DD HH:mm:ss").toDate()
  )
  @ApiProperty({required: false})
  @IsOptional()
  infoDt: Date;

  @ApiProperty({required: false})
  @IsOptional()
  cupsId: number;

  @ApiProperty({required: false})
  @IsOptional()
  import: number;

  @ApiProperty({required: false})
  @IsOptional()
  consumption: number;

  @ApiProperty({required: false})
  @IsOptional()
  communityGeneration: number;

  @ApiProperty({required: false})
  @IsOptional()
  virtualGeneration: number;

  @ApiProperty({required: false})
  @IsOptional()
  export: number;

  @ApiProperty({required: false})
  @IsOptional()
  generation: number;

  @ApiProperty({required: false})
  @IsOptional()
  origin: string;

  @ApiProperty({required: false})
  @IsOptional()
  type: string;

  @ApiProperty({required: false})
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
