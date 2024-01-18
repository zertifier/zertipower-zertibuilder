import { FilterField } from "./FilterField";
import { FilterOperator } from "./FilterOperator";
import { FilterValue } from "./FilterValue";

export class Filter {
  constructor(
    public readonly filterField: FilterField,
    public readonly filterOperator: FilterOperator,
    public readonly filterValue: FilterValue
  ) {}
}
