import { Filter } from "./filter/Filter";
import { Limit } from "./Limit";
import { Offset } from "./Offset";
import { Order } from "./order/Order";

export class Criteria {
	constructor(
		public readonly filters: Array<Filter>,
		public readonly order: Order = Order.none(),
		public readonly limit: Limit = Limit.none(),
		public readonly offset: Offset = Offset.none(),
	) {}

	/**
	 * Return empty criteria
	 */
	public static none(): Criteria {
		return new Criteria([], Order.none());
	}

	/**
	 * Check if it has filters
	 */
	public hasFilters(): boolean {
		return this.filters.length > 0;
	}
}
