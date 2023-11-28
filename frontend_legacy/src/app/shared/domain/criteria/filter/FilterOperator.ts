import { EnumValueObject } from "../../value-object/EnumValueObject";

export enum FilterOperators {
	EQUAL = "=",
	NOT_EQUAL = "!=",
	EQUAL_GREATER = ">=",
	EQUAL_MINOR = "<=",
	GREATER = ">",
	MINOR = "<",
	IN = "IN",
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

		throw new Error(`Filter operator ${value} not valid`);
	}

	protected throwErrorForInvalidValue(value: FilterOperators): void {
		throw new Error(`Filter operator ${value} not valid`);
	}
}
