import { Criteria } from "../../../shared/domain/criteria/Criteria";
import { Order } from "../../../shared/domain/criteria/order/Order";
import { Limit } from "../../../shared/domain/criteria/Limit";
import { Filter } from "../../../shared/domain/criteria/filter/Filter";
import { FilterField } from "../../../shared/domain/criteria/filter/FilterField";
import {
	FilterOperator,
	FilterOperators,
} from "../../../shared/domain/criteria/filter/FilterOperator";
import { FilterValue } from "../../../shared/domain/criteria/filter/FilterValue";

export class ByReportId extends Criteria {
	constructor(id: number) {
		super(
			[
				new Filter(
					new FilterField("id"),
					new FilterOperator(FilterOperators.EQUAL),
					new FilterValue(id),
				),
			],
			Order.none(),
			new Limit(1),
		);
	}
}
