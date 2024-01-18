import { Transform } from "class-transformer";
import { IsOptional, IsDefined } from "class-validator";
import * as moment from "moment";

export class SaveProvidersDTO {
  @IsOptional()
  id: number;
  @IsOptional()
  provider: string;
}
