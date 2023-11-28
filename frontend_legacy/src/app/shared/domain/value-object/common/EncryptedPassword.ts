import { StringValueObject } from "../StringValueObject";
import { InvalidArgumentError } from "../../error/commmon/InvalidArgumentError";

export class EncryptedPassword extends StringValueObject {
	constructor(value: string) {
		super(value);
		this.ensureIsNotEmpty(value);
	}

	private ensureIsNotEmpty(value: string) {
		if (value === "") {
			throw new InvalidArgumentError("Encrypted password cannot be empty");
		}
	}
}
