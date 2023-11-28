import { StringValueObject } from "../StringValueObject";
import { InvalidArgumentError } from "../../error/commmon/InvalidArgumentError";

export class Lastname extends StringValueObject {
	private ensureIsNotEmpty(value: string) {
		if (value === "") {
			throw new InvalidArgumentError("Lastname cannot be empty");
		}
	}
}
