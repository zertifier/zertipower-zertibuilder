import { IntegerValueObject } from "./IntegerValueObject";

export class UIntegerValueObject extends IntegerValueObject {
	constructor(value: number) {
		super(value);
		this.ensureIsPositive(value);
	}

	private ensureIsPositive(value: number) {
		if (value < 0) {
			throw new Error("Value cannot be negative");
		}
	}
}
