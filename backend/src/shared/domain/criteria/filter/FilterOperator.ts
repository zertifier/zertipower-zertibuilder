import { EnumValueObject } from "../../value-object";
import { InvalidArgumentError } from "../../error/common";

export enum FilterOperators {
  EQUAL = "=",
  NOT_EQUAL = "!=",
  EQUAL_GREATER = ">=",
  EQUAL_MINOR = "<=",
  GREATER = ">",
  MINOR = "<",
  IN = "in",
  IS_NULL = "is_null",
  LIKE = "like",
}

export class FilterOperator extends EnumValueObject<FilterOperators> {
  constructor(value: FilterOperators) {
    super(value, Object.values(FilterOperators));
  }

  public static fromValue(value: string): FilterOperator {
    for (const enumValue of Object.values(FilterOperators)) {
      if (value === enumValue) {
        return new FilterOperator(enumValue);
      }
    }

    throw new InvalidArgumentError(`Filter operator ${value} not valid`);
  }

  protected throwErrorForInvalidValue(value: FilterOperators): void {
    throw new InvalidArgumentError(`Filter operator ${value} not valid`);
  }
}
