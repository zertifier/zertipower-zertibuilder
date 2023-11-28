import { ValueObject } from './ValueObject';
import { InvalidArgumentError } from '../error/common';

export class NonEmptyStringValueObject extends ValueObject<string> {
  constructor(value: string) {
    super(value);
    this.ensureIsNotEmpty(value);
  }

  private ensureIsNotEmpty(value: string) {
    if (value === '') {
      throw new InvalidArgumentError('Value must be a non empty string');
    }
  }
}
