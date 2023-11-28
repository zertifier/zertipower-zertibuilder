import { Primitives, ValueObject } from '../../value-object';

export class FilterValue extends ValueObject<Primitives | Array<Primitives>> {
  constructor(value: Primitives | Array<Primitives>) {
    super(value);
  }
}
