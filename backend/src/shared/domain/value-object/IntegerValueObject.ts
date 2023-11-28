import { ValueObject } from './ValueObject';
import { InvalidArgumentError } from '../error/common';

export class IntegerValueObject extends ValueObject<number> {
  constructor(value: number) {
    super(value);
    this.ensureIsInteger(value);
  }

  /**
   * This method ensures that provided value is integer.
   *
   * Their purpose is to ensure that the provided value is not a double.
   * Remember that javascript don't differentiate between integers and doubles.
   * If we need that the provided value have to be an integer we use this to avoid future errors.
   * @param value
   * @private
   */
  private ensureIsInteger(value: number) {
    if (isNaN(value)) {
      throw new InvalidArgumentError(`Value is 'NaN'`);
    }

    // If the value is a double vale the comparison will be the following
    // value = 5.3
    // 5.3 !== parseInt('5.3') -> 5.3 !== 5
    // This is how we ensure that is an integer and not a double
    if (value !== parseInt(value.toString())) {
      throw new InvalidArgumentError(
        `Value must be an integer, ${value} provided`,
      );
    }
  }
}
