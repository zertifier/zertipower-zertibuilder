import { Transform } from 'class-transformer';
import { IsOptional, IsDefined } from 'class-validator';
import * as moment from 'moment';
export class SaveEnergyRegistersHourlyDto {
  @IsOptional()
  id: number;
  @Transform((value) =>
    moment.utc((value as any).value, 'YYYY-MM-DD HH:mm:ss').toDate(),
  )
  @IsOptional()
  infoDatetime: Date;
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
}
