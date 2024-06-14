import { Transform } from "class-transformer";
import { IsOptional, IsDefined } from "class-validator";
import * as moment from "moment";

export class SaveCommunitiesDTO {

  @IsOptional()
  id?: number;

  @IsOptional()
  name: string;

  @IsOptional()
  test: number;

  @IsOptional()
  geolocation: string;

  @IsOptional()
  energyPrice:number;

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

export class SaveDaoDTO{
  @IsOptional()
  daoAddress: string;
  @IsOptional()
  daoName: string;
  @IsOptional()
  daoSymbol: string;
}
