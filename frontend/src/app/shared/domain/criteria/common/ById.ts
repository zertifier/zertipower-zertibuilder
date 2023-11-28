import { Criteria } from "../Criteria";
import { Order } from "../order/Order";
import { Limit } from "../Limit";
import { Filter } from "../filter/Filter";
import { FilterField } from "../filter/FilterField";
import { FilterOperator, FilterOperators } from "../filter/FilterOperator";
import { FilterValue } from "../filter/FilterValue";

export class ById extends Criteria {
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
