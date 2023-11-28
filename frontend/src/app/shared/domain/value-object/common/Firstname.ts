import { StringValueObject } from "../StringValueObject";
import { InvalidArgumentError } from "../../error/commmon/InvalidArgumentError";

export class Firstname extends StringValueObject {
	constructor(value: string) {
		super(value);
		this.ensureIsNotEmpty(value);
	}

	/**
	 * We don't want that user first name is empty
	 * @param value
	 * @private
	 */
	private ensureIsNotEmpty(value: string): void {
		if (value === "") {
			throw new InvalidArgumentError("Firstname cannot be empty");
		}
	}
}
