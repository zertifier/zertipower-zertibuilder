import { Criteria } from '../../../../shared/domain/criteria/Criteria';
import { Filter } from '../../../../shared/domain/criteria/filter/Filter';
import { FilterField } from '../../../../shared/domain/criteria/filter/FilterField';
import {
  FilterOperator,
  FilterOperators,
} from '../../../../shared/domain/criteria/filter/FilterOperator';
import { FilterValue } from '../../../../shared/domain/criteria/filter/FilterValue';

export class ByPermissionActions extends Criteria {
  constructor(actions: string[]) {
    super([
      new Filter(
        new FilterField('action'),
        new FilterOperator(FilterOperators.IN),
        new FilterValue(actions),
      ),
    ]);
  }
}
