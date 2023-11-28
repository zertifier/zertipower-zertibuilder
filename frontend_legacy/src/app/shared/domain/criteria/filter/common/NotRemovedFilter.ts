import { Filter } from "../Filter";
import { FilterField } from "../FilterField";
import { FilterOperator, FilterOperators } from "../FilterOperator";
import { FilterValue } from "../FilterValue";

export class NotRemovedFilter extends Filter {
	constructor() {
		super(
			new FilterField("removed"),
			new FilterOperator(FilterOperators.EQUAL),
			new FilterValue(false),
		);
	}
}
