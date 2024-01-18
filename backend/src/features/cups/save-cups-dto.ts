import { Transform } from "class-transformer";
import { IsOptional, IsDefined } from "class-validator";
import * as moment from "moment";

export class SaveCupsDTO {
  @IsOptional()
  id: number;
  @IsOptional()
  cups: string;
  @IsOptional()
  providerId: number;
  @IsOptional()
  communityId: number;
  @IsOptional()
  ubication: string;
  @IsOptional()
  geolocalization: string;
  @IsOptional()
  customerId: number;
}
