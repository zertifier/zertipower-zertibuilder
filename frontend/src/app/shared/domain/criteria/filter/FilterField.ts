import { StringValueObject } from "../../value-object/StringValueObject";

export class FilterField extends StringValueObject {
	constructor(value: string) {
		super(value);
		this.ensureIsNotEmpty(value);
	}

	private ensureIsNotEmpty(value: string) {
		if (value === "") {
			throw new Error("Filter field cannot be empty");
		}
	}
}
