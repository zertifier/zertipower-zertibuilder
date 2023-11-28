import { Criteria } from '../../../shared/domain/criteria/Criteria';
import { Order } from '../../../shared/domain/criteria/order/Order';
import { Limit } from '../../../shared/domain/criteria/Limit';
import { Offset } from '../../../shared/domain/criteria/Offset';
import { Filter } from '../../../shared/domain/criteria/filter/Filter';
import { FilterField } from '../../../shared/domain/criteria/filter/FilterField';
import {
  FilterOperator,
  FilterOperators,
} from '../../../shared/domain/criteria/filter/FilterOperator';
import { FilterValue } from '../../../shared/domain/criteria/filter/FilterValue';

export class ByWalletAddress extends Criteria {
  constructor(walletAddress: string) {
    super(
      [
        new Filter(
          new FilterField('wallet_address'),
          new FilterOperator(FilterOperators.LIKE),
          new FilterValue(walletAddress),
        ),
      ],
      Order.none(),
      Limit.none(),
      Offset.none(),
    );
  }
}
