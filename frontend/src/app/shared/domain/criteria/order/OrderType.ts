import { EnumValueObject } from "../../value-object/EnumValueObject";

export enum OrderTypes {
	ASC = "ASC",
	DESC = "DESC",
	NONE = "NONE",
}

export class OrderType extends EnumValueObject<OrderTypes> {
	constructor(value: OrderTypes) {
		super(value, Object.values(OrderTypes));
	}

	public static fromValue(value: string): OrderType {
		for (const enumValue of Object.values(OrderTypes)) {
			if (enumValue === value) {
				return new OrderType(value);
			}
		}

		throw new Error(`Order type ${value} not valid`);
	}

	public static none(): OrderType {
		return new OrderType(OrderTypes.NONE);
	}

	public static asc(): OrderType {
		return new OrderType(OrderTypes.ASC);
	}

	public static desc(): OrderType {
		return new OrderType(OrderTypes.DESC);
	}

	public equals(orderType: OrderType): boolean {
		return this.value === orderType.value;
	}

	protected throwErrorForInvalidValue(value: OrderTypes): void {
		throw new Error(`Order type ${value} not valid`);
	}
}
