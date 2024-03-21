import { Transform } from "class-transformer";
import { IsOptional, IsDefined } from "class-validator";
import * as moment from "moment";

export class SaveCalendarDTO {
  @Transform((value) =>
    moment.utc((value as any).value, "YYYY-MM-DD HH:mm:ss").toDate()
  )
  @IsOptional()
  day: Date;
  @IsOptional()
  weekday: string;
  @IsOptional()
  dayType: string;
  @IsOptional()
  festiveType: string;
  @IsOptional()
  festivity: string;
}
