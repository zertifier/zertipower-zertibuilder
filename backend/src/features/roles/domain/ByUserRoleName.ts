import { Criteria } from "../../../shared/domain/criteria/Criteria";
import { Filter } from "../../../shared/domain/criteria/filter/Filter";
import { FilterField } from "../../../shared/domain/criteria/filter/FilterField";
import {
  FilterOperator,
  FilterOperators,
} from "../../../shared/domain/criteria/filter/FilterOperator";
import { FilterValue } from "../../../shared/domain/criteria/filter/FilterValue";
import { Order } from "../../../shared/domain/criteria/order/Order";
import { Limit } from "../../../shared/domain/criteria/Limit";

export class ByUserRoleName extends Criteria {
  constructor(name: string) {
    super(
      [
        new Filter(
          new FilterField("name"),
          new FilterOperator(FilterOperators.EQUAL),
          new FilterValue(name)
        ),
      ],
      Order.none(),
      new Limit(1)
    );
  }
}
