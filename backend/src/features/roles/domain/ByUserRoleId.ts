import { Criteria } from '../../../shared/domain/criteria/Criteria';
import { Filter } from '../../../shared/domain/criteria/filter/Filter';
import { FilterField } from '../../../shared/domain/criteria/filter/FilterField';
import {
  FilterOperator,
  FilterOperators,
} from '../../../shared/domain/criteria/filter/FilterOperator';
import { FilterValue } from '../../../shared/domain/criteria/filter/FilterValue';

export class ByUserRoleId extends Criteria {
  constructor(id: number) {
    super([
      new Filter(
        new FilterField('id'),
        new FilterOperator(FilterOperators.EQUAL),
        new FilterValue(id),
      ),
    ]);
  }
}
