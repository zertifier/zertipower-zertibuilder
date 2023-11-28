import { Transform } from 'class-transformer';
import { IsOptional, IsDefined } from 'class-validator';
import * as moment from 'moment';

export class SaveEnergyTransactionsDTO {
  @IsOptional()
  id: number;
  @IsOptional()
  cupsId: number;
  @Transform((value) =>
    moment.utc((value as any).value, 'YYYY-MM-DD HH:mm:ss').toDate(),
  )
  @IsOptional()
  infoDt: Date;
  @IsOptional()
  kwhIn: number;
  @IsOptional()
  kwhOut: number;
  @IsOptional()
  kwhSurplus: number;
  @IsOptional()
  blockId: number;
  @Transform((value) =>
    moment.utc((value as any).value, 'YYYY-MM-DD HH:mm:ss').toDate(),
  )
  @IsOptional()
  createdAt: Date;
  @Transform((value) =>
    moment.utc((value as any).value, 'YYYY-MM-DD HH:mm:ss').toDate(),
  )
  @IsOptional()
  updatedAt: Date;
}
