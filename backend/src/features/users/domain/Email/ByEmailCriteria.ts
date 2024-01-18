import { Criteria } from "../../../../shared/domain/criteria/Criteria";
import { Filter } from "../../../../shared/domain/criteria/filter/Filter";
import { Order } from "../../../../shared/domain/criteria/order/Order";
import { FilterField } from "../../../../shared/domain/criteria/filter/FilterField";
import {
  FilterOperator,
  FilterOperators,
} from "../../../../shared/domain/criteria/filter/FilterOperator";
import { FilterValue } from "../../../../shared/domain/criteria/filter/FilterValue";

export class ByEmailCriteria extends Criteria {
  constructor(email: string) {
    super(
      [
        new Filter(
          new FilterField("email"),
          new FilterOperator(FilterOperators.EQUAL),
          new FilterValue(email)
        ),
      ],
      Order.none()
    );
  }
}
