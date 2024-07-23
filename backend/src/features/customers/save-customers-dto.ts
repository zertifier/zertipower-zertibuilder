import { Transform } from "class-transformer";
import { IsOptional, IsDefined } from "class-validator";
import * as moment from "moment";

export class SaveCustomersDTO {
/*  @IsOptional()
  id: number;*/
  
  @IsOptional()
  name: string;

  @IsOptional()
  walletAddress: string;

  @IsOptional()
  dni: string;

  @IsOptional()
  balance: string;

  @IsOptional()
  email: string;
  
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
