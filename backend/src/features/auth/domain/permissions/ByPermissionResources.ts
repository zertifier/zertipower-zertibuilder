import { Criteria } from "../../../../shared/domain/criteria/Criteria";
import { Filter } from "../../../../shared/domain/criteria/filter/Filter";
import { FilterField } from "../../../../shared/domain/criteria/filter/FilterField";
import {
  FilterOperator,
  FilterOperators,
} from "../../../../shared/domain/criteria/filter/FilterOperator";
import { FilterValue } from "../../../../shared/domain/criteria/filter/FilterValue";

export class ByPermissionResources extends Criteria {
  constructor(resources: string[]) {
    super([
      new Filter(
        new FilterField("resource"),
        new FilterOperator(FilterOperators.IN),
        new FilterValue(resources)
      ),
    ]);
  }
}
