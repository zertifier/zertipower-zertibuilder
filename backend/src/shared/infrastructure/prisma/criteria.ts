import { Criteria } from "../../domain/criteria/Criteria";
import { FilterOperators } from "../../domain/criteria/filter/FilterOperator";
import { FilterValue } from "../../domain/criteria/filter/FilterValue";
import { OrderType } from "../../domain/criteria/order/OrderType";

function convertFilterOperator(
  filterOperator: FilterOperators,
  filterValue: FilterValue
) {
  switch (filterOperator) {
    case FilterOperators.EQUAL:
      return {
        equals: filterValue.value,
      };
    case FilterOperators.NOT_EQUAL:
      return {
        not: {
          equals: filterValue.value,
        },
      };
    case FilterOperators.MINOR:
      return {
        lt: filterValue.value,
      };
    case FilterOperators.GREATER:
      return {
        gt: filterValue.value,
      };
    case FilterOperators.EQUAL_GREATER:
      return {
        gte: filterValue.value,
      };
    case FilterOperators.EQUAL_MINOR:
      return {
        lte: filterValue.value,
      };
    case FilterOperators.IN:
      return {
        in: filterValue.value,
      };
    case FilterOperators.IS_NULL:
      return {
        equals: null,
      };
    case FilterOperators.LIKE:
      return {
        contains: filterValue.value,
      };
  }
}

export function toPrismaFilters(criteria: Criteria): any {
  if (!criteria.hasFilters()) {
    return {};
  }

  const whereClause: any = {};
  for (const filter of criteria.filters) {
    // Selecting filter field
    let filterField = whereClause[filter.filterField.value];
    if (!filterField) {
      filterField = {};
      whereClause[filter.filterField.value] = filterField;
    }

    filterField = {
      ...filterField,
      ...convertFilterOperator(filter.filterOperator.value, filter.filterValue),
    };
    whereClause[filter.filterField.value] = filterField;
  }

  return whereClause;
}

export function toPrismaSorting(criteria: Criteria) {
  if (criteria.order.orderType.equals(OrderType.none())) {
    return [];
  }
  const orderBy: any = {};
  orderBy[criteria.order.orderBy.value] =
    criteria.order.orderType.value.toLowerCase();
  return [orderBy];
}
