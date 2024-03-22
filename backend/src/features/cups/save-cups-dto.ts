import { Transform } from "class-transformer";
import { IsOptional, IsDefined } from "class-validator";
import * as moment from "moment";

export class SaveCupsDto {
/*  @IsOptional()
  id: number;*/
  @IsOptional()
  cups: string;

  @IsOptional()
  cummunityId: number;

  @IsOptional()
  customerId: number;

  @IsOptional()
  locationId: number;

  @IsOptional()
  providerId: number;

  @IsOptional()
  lng: number;

  @IsOptional()
  lat: number;

  @IsOptional()
  address: string;

  @IsOptional()
  type: CupsType | null;

  @IsOptional()
  surplusDistribution: string | null;

  @IsOptional()
  datadisActive?: boolean | null;

  @IsOptional()
  datadisUser?: string | null;

  @IsOptional()
  datadisPassword?: string | null;

  @IsOptional()
  smartMeterActive: boolean;

  @IsOptional()
  smartMeterModel: string;

  @IsOptional()
  smartMeterApiKey?: string | null;

  @IsOptional()
  inverterActive: boolean;

  @IsOptional()
  inverterModel?: string | null;

  @IsOptional()
  inverterApiKey?: string | null;

  @IsOptional()
  sensorActive: boolean;

  @IsOptional()
  sensorModel?: string | null;

  @IsOptional()
  sensorApiKey?: string | null;

/*  @Transform((value) =>
    moment.utc((value as any).value, "YYYY-MM-DD HH:mm:ss").toDate()
  )
  @IsOptional()
  createdAt: Date;
  @Transform((value) =>
    moment.utc((value as any).value, "YYYY-MM-DD HH:mm:ss").toDate()
  )
  @IsOptional()
  updatedAt: Date;*/
}

enum CupsType {
  CONSUMER = 'consumer',
  PRODUCER = 'producer',
  PROSUMER = 'prosumer'
}
