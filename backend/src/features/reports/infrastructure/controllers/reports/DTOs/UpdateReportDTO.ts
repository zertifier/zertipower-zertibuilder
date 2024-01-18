import {
  ArrayNotEmpty,
  IsDefined,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { CreateReportColumnDTO, CreateReportParamDTO } from "./CreateReportDTO";

export class UpdateReportDTO {
  @IsNumber()
  @IsDefined()
  @IsPositive()
  id: number;

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
  @ArrayNotEmpty()
  @Type(() => CreateReportParamDTO)
  params: Array<CreateReportParamDTO>;

  @ValidateNested({ each: true })
  @IsNotEmpty()
  @ArrayNotEmpty()
  @Type(() => CreateReportColumnDTO)
  columns: Array<CreateReportColumnDTO>;
}
