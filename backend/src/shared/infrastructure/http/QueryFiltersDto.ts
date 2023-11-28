import { IsOptional, IsString, Validate } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

function IsStringOrArrayOfStrings() {
  return Validate((value: any) => {
    if (typeof value === 'string') {
      return true;
    } else if (Array.isArray(value)) {
      return value.every((item) => typeof item === 'string');
    }
    return false;
  });
}

export class FilterTypeDTO {
  @ApiProperty()
  @IsString()
  field: string;

  @ApiProperty()
  @IsString()
  operator: string;

  @ApiProperty()
  @IsStringOrArrayOfStrings()
  value: string | Array<string>;
}

export class QueryFilterDto {
  @ApiProperty({ required: false })
  @IsOptional()
  filters?: Array<FilterTypeDTO>;

  @ApiProperty({ required: false })
  @IsOptional()
  order_by?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  order_type?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  limit?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  offset?: string;
}
