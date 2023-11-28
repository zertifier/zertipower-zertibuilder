import { Criteria } from '../../../../../shared/domain/criteria/Criteria';
import { Order } from '../../../../../shared/domain/criteria/order/Order';
import { Filter } from '../../../../../shared/domain/criteria/filter/Filter';
import { FilterField } from '../../../../../shared/domain/criteria/filter/FilterField';
import {
  FilterOperator,
  FilterOperators,
} from '../../../../../shared/domain/criteria/filter/FilterOperator';
import { FilterValue } from '../../../../../shared/domain/criteria/filter/FilterValue';

export class ByEncodedTokenCriteria extends Criteria {
  constructor(token: string) {
    super(
      [
        new Filter(
          new FilterField('token'),
          new FilterOperator(FilterOperators.EQUAL),
          new FilterValue(token),
        ),
      ],
      Order.none(),
    );
  }
}
