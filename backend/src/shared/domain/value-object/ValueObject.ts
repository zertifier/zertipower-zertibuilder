import { InvalidArgumentError } from '../error/common';

export type Primitives = number | string | boolean | Date;

export abstract class ValueObject<T extends Primitives | Array<Primitives>> {
  public readonly value: T;

  protected constructor(value: T) {
    this.ensureIsDefined(value);
    this.value = value;
  }

  private ensureIsDefined(value: T) {
    if (value === undefined || value === null) {
      throw new InvalidArgumentError('Value must be defined');
    }
  }
}
