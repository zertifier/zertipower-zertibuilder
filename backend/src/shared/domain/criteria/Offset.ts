import { IntegerValueObject } from '../value-object';
import { InvalidArgumentError } from '../error/common';

export class Offset extends IntegerValueObject {
  constructor(value: number) {
    super(value);
    this.ensureIsNotNegative(value);
  }

  public static none(): Offset {
    return new Offset(0);
  }

  public isEmpty(): boolean {
    return this.value === 0;
  }

  private ensureIsNotNegative(value: number) {
    if (value < 0) {
      throw new InvalidArgumentError('Offset value cannot be negative');
    }
  }
}
