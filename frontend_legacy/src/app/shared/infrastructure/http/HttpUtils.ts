import { Criteria } from "../../domain/criteria/Criteria";
import { OrderType } from "../../domain/criteria/order/OrderType";

export class HttpUtils {
	public static convertCriteriaToQueryParams(criteria: Criteria): string {
		const queries: string[] = [];
		const { filters } = criteria;
		for (let i = 0; i < filters.length; i++) {
			const filter = filters[i];
			if (filter.filterValue.value.constructor === Array) {
				const filterValues = filter.filterValue.value
					.map((value, index) => `filters[${i}][value][${index}]=${value}`)
					.join("&");
				queries.push(
					`filters[${i}][field]=${filter.filterField.value}&filters[${i}][operator]=${filter.filterOperator.value}&${filterValues}`,
				);
			} else {
				queries.push(
					`filters[${i}][field]=${filter.filterField.value}&filters[${i}][operator]=${filter.filterOperator.value}&filters[${i}][value]=${filter.filterValue.value}`,
				);
			}
		}

		if (!criteria.order.orderType.equals(OrderType.none())) {
			queries.push(
				`order_by=${criteria.order.orderBy.value}&order_type=${criteria.order.orderType.value}`,
			);
		}

		if (criteria.limit) {
			queries.push(`limit=${criteria.limit.value}`);
		}

		if (criteria.offset) {
			queries.push(`offset=${criteria.offset.value}`);
		}

		return queries.join("&");
	}
}
