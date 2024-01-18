import { Transform } from "class-transformer";
import { IsOptional, IsDefined } from "class-validator";
import * as moment from "moment";
export class SaveEnergyRegistersDTO {
  @IsOptional()
  id: number;
  @Transform((value) =>
    moment.utc((value as any).value, "YYYY-MM-DD HH:mm:ss").toDate()
  )
  @IsOptional()
  infoDt: Date;
  @IsOptional()
  cupsId: number;
  @IsOptional()
  import: number;
  @IsOptional()
  consumption: number;
  @IsOptional()
  export: number;
  @IsOptional()
  generation: number;
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
