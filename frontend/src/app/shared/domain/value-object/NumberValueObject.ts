import { ValueObject } from "./ValueObject";

export class NumberValueObject extends ValueObject<number> {
	constructor(value: number) {
		super(value);
		this.ensureIsNumber(value);
	}

	private ensureIsNumber(value: number) {
		if (value !== parseFloat(`${value}`)) {
			throw new Error(`'${value}' is not a number`);
		}
	}
}
