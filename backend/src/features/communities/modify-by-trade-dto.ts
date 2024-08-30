import {IsOptional} from "class-validator";
// import {TradeTypes} from "../../shared/infrastructure/services/share/share.service";
import { TradeTypes } from '@prisma/client';


export class ModifyByTradeDTO{
  @IsOptional()
  name: string;

  @IsOptional()
  tradeType: TradeTypes;
}
