import { Transform } from "class-transformer";
import { IsOptional, IsDefined } from "class-validator";
import * as moment from "moment";

export class SaveSharesDto {
/*  @IsOptional()
  id: number;*/
  @IsOptional()
  communityId: number;
  @IsOptional()
  customerId: number;
  @IsOptional()
  shares: number;
}
