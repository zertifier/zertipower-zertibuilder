import {
  ArrayNotEmpty,
  IsDefined,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { ReportParamTypes } from "../../../../domain/report-param";

export class CreateReportDTO {
  @IsString()
  @IsNotEmpty()
  @IsDefined()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsDefined()
  sql: string;

  @ValidateNested({ each: true })
  @IsOptional()
  @Type(() => CreateReportParamDTO)
  params: Array<CreateReportParamDTO>;

  @ValidateNested({ each: true })
  @IsNotEmpty()
  @ArrayNotEmpty()
  @Type(() => CreateReportColumnDTO)
  columns: Array<CreateReportColumnDTO>;
}

export class CreateReportColumnDTO {
  @IsString()
  @IsNotEmpty()
  @IsDefined()
  name: string;

  @IsDefined()
  @IsNumber()
  @IsPositive()
  size: number;
}

export class CreateReportParamDTO {
  @IsString()
  @IsNotEmpty()
  @IsDefined()
  name: string;

  @IsNotEmpty()
  @IsEnum(ReportParamTypes)
  type: ReportParamTypes;
}
