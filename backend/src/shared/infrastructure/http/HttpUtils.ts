import { Criteria } from '../../domain/criteria/Criteria';
import { FilterOperator } from '../../domain/criteria/filter/FilterOperator';
import { Filter } from '../../domain/criteria/filter/Filter';
import { FilterField } from '../../domain/criteria/filter/FilterField';
import { FilterValue } from '../../domain/criteria/filter/FilterValue';
import { Order } from '../../domain/criteria/order/Order';
import { OrderType } from '../../domain/criteria/order/OrderType';
import { OrderBy } from '../../domain/criteria/order/OrderBy';
import { Limit } from '../../domain/criteria/Limit';
import { Offset } from '../../domain/criteria/Offset';
import {
  BadRequestError,
  InfrastructureError,
  InvalidArgumentError,
} from '../../domain/error/common';
import { TypeUtils } from '../../domain/utils';
import { QueryFilterDto } from './QueryFiltersDto';

export interface FilterSchema {
  field: string;
  value: 'string' | 'float' | 'integer' | 'boolean' | 'date';
}

type FilterType = {
  field?: string;
  operator?: string;
  value?: string | Array<string>;
};

export class HttpUtils {
  public static parseFiltersFromQueryFilters(
    queryFilters: QueryFilterDto,
    schema: Array<FilterSchema>,
  ): Criteria {
    const {
      filters,
      order_by,
      order_type,
      limit: query_limit,
      offset: query_offset,
    } = queryFilters;
    const filterMaps = filters as Array<FilterType>;
    const parsedFilters = filterMaps
      ? this.parseFilters(filterMaps, schema)
      : [];
    let order: Order = Order.none();
    let limit: Limit;
    let offset: Offset;

    if (order_by) {
      if (
        schema
          .map((filterSchema) => filterSchema.field)
          .includes(order_by as string)
      ) {
        if (order_type) {
          order = new Order(
            new OrderBy(order_by as string),
            OrderType.fromValue(order_type as string),
          );
        } else {
          order = new Order(new OrderBy(order_by as string), OrderType.none());
        }
      } else {
        throw new BadRequestError('Order by not valid');
      }
    }

    const parsedLimit = parseInt(query_limit as string);
    if (!parsedLimit) {
      limit = Limit.none();
    } else {
      limit = new Limit(parsedLimit);
    }

    const parsedOffset = parseInt(query_offset as string);
    if (!parsedOffset) {
      offset = Offset.none();
    } else {
      offset = new Offset(parsedOffset);
    }

    return new Criteria(parsedFilters, order, limit, offset);
  }

  public static mapFilterValue(
    value: string,
    schema: FilterSchema,
  ): number | string | Date | boolean {
    switch (schema.value) {
      case 'float':
        return TypeUtils.toFloat(value);
      case 'integer':
        return TypeUtils.toInteger(value);
      case 'boolean':
        return TypeUtils.toBool(value);
      case 'date':
        return TypeUtils.toDate(value);
      default:
        return value;
    }
  }

  public static parseFilters(
    params: Array<FilterType>,
    schema: Array<FilterSchema>,
  ): Array<Filter> {
    return params.map((filterMap) => {
      let filterValue: FilterValue;

      // Getting field name
      const fieldName = filterMap.field;
      if (!fieldName) {
        throw new InfrastructureError('Error parsing filters');
      }
      const filterField = new FilterField(fieldName);

      // Getting schema
      const filterSchema = schema.find(
        (filterSchema) => filterSchema.field === fieldName,
      );
      if (!filterSchema) {
        throw new InvalidArgumentError(
          `Filter field ${fieldName} is not valid`,
        );
      }

      // Parsing filter value
      const value = filterMap.value;
      if (!value) {
        throw new InvalidArgumentError('Filter value not provided');
      }
      if (value.constructor === Array) {
        filterValue = new FilterValue(
          value.map((rawValue) => this.mapFilterValue(rawValue, filterSchema)),
        );
      } else {
        filterValue = new FilterValue(
          this.mapFilterValue(value as string, filterSchema),
        );
      }

      // Parsing operator
      const operator = filterMap.operator;
      if (!operator) {
        throw new InvalidArgumentError('Filter operator not provided');
      }
      const filterOperator = FilterOperator.fromValue(operator);

      return new Filter(filterField, filterOperator, filterValue);
    });
  }
}
