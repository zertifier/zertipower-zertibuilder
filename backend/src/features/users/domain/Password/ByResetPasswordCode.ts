import { Criteria } from "../../../../shared/domain/criteria/Criteria";
import { Filter } from "../../../../shared/domain/criteria/filter/Filter";
import { FilterField } from "../../../../shared/domain/criteria/filter/FilterField";
import {
  FilterOperator,
  FilterOperators,
} from "../../../../shared/domain/criteria/filter/FilterOperator";
import { FilterValue } from "../../../../shared/domain/criteria/filter/FilterValue";
import { Order } from "../../../../shared/domain/criteria/order/Order";
import { Limit } from "../../../../shared/domain/criteria/Limit";

export class ByResetPasswordCode extends Criteria {
  constructor(code: string) {
    super(
      [
        new Filter(
          new FilterField("recover_password_code"),
          new FilterOperator(FilterOperators.EQUAL),
          new FilterValue(code)
        ),
      ],
      Order.none(),
      new Limit(1)
    );
  }
}
