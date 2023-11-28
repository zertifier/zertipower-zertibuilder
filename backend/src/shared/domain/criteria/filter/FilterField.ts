import { StringValueObject } from '../../value-object';
import { InvalidArgumentError } from '../../error/common';

export class FilterField extends StringValueObject {
  constructor(value: string) {
    super(value);
    this.ensureIsNotEmpty(value);
  }

  private ensureIsNotEmpty(value: string) {
    if (value === '') {
      throw new InvalidArgumentError('Filter field cannot be empty');
    }
  }
}
