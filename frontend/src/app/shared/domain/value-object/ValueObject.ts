export type Primitives = number | string | boolean | Date;

export abstract class ValueObject<T extends Primitives | Array<Primitives>> {
	public readonly value: T;

	constructor(value: T) {
		this.ensureIsDefined(value);
		this.value = value;
	}

	private ensureIsDefined(value: T) {
		if (value === undefined || value === null) {
			throw new Error("Value must be defined");
		}
	}
}
