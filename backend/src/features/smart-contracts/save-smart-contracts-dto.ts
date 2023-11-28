import { Transform } from 'class-transformer';
import { IsOptional, IsDefined } from 'class-validator';
import * as moment from 'moment';

export class SaveSmartContractsDTO {
  @IsOptional()
  id: number;
  @IsOptional()
  contractAddress: string;
  @IsOptional()
  blockchainId: number;
}
