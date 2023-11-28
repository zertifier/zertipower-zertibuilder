import { Injectable } from '@nestjs/common';
import * as format from 'pg-format';
import { PostgresService } from '../postgres/postgres.service';
import { Datatable, DatatableParams } from './Datatable';

@Injectable({})
export class PostgresDatatable implements Datatable {
  private pool = this.postgres.pool;
  constructor(private postgres: PostgresService) {}

  async getData(
    params: DatatableParams,
    query: string,
  ): Promise<{
    draw: number;
    data: unknown;
    recordsTotal: number;
    recordsFiltered: number;
  }> {
    // All this params will be appended to the final SQL query
    // after parsing query parameters
    const filterParams: string[] = [];
    const orderParams: string[] = [];
    const limitParams: number[] = [];

    // Adding to limit params
    limitParams.push(params.length);
    limitParams.push(params.start);
    const limit = ' LIMIT %L OFFSET %L ';

    // Getting searchable columns
    const searchableColumns = params.columns.filter(
      (column) => column.searchable,
    );

    const searchArr: string[] = [];

    const globalSearchArr: string[] = [];

    // Creating filter statements
    // This includes global search and individual search
    // Applying global search for those columns that are searchable
    if (params.search.value)
      for (const column of searchableColumns) {
        filterParams.push(column.data);

        // There are two ways to search
        // 1. Using regex
        // 2. Using a like operator
        let operator;
        // If a regex is provided then create an operator for regex search
        if (params.search.regex) {
          filterParams.push(params.search.value);
          operator = ' REGEXP %s ';
        } else {
          // If not create an operator for like.
          // Surrounding this with %% allows as to implement a functionality
          // like 'contains'
          filterParams.push(`'%${params.search.value}%'`);
          operator = ' LIKE %s ';
        }
        globalSearchArr.push(` %I ${operator}`);
      }
    if (globalSearchArr.length)
      searchArr.push(`(${globalSearchArr.join(' OR ')})`);

    // Creating statements for individual search
    const individualSearchArr: string[] = [];
    for (const column of searchableColumns) {
      if (column.search.value) {
        filterParams.push(column.data);

        let operator;
        if (column.search.regex) {
          filterParams.push(column.search.value);
          operator = ' REGEXP %s ';
        } else {
          filterParams.push(`'%${column.search.value}%'`);
          operator = ' LIKE %s ';
        }

        // ?? is used to escape multiple values ej.
        // SELECT ?? FROM users, ['id', 'username', 'email'] -> SELECT `id`, `username`, `email` FROM users
        // in this case ?? will be replaced by column.data
        individualSearchArr.push(` %I ${operator}`);
      }
    }
    if (individualSearchArr.length)
      searchArr.push(`(${individualSearchArr.join(' AND ')})`);

    // Filter is the main string that contains all the filters applied to data
    const filter = searchArr.length ? ` WHERE ${searchArr.join(' AND ')} ` : '';

    // Creating order statements
    const orderArr: string[] = [];
    for (const orderInfo of params.order) {
      const columnName = params.columns[orderInfo.column].data;
      orderParams.push(columnName);
      orderArr.push(`
            %I
             ${orderInfo.dir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'}
             `);
    }

    const order = orderArr.length ? ` ORDER BY ${orderArr.join(', ')} ` : '';

    // Getting how many records are fetched with this query without pagination
    const recordsTotal = (
      await this.pool.query(
        format(
          `SELECT COUNT(*) count
         FROM (${query}) a `,
        ),
      )
    ).rows[0].count;

    // Getting how many records are filtered with this query without pagination
    const recordsFiltered = (
      await this.pool.query(
        format(
          `SELECT COUNT(*) count
         FROM (${query}) a ${filter}`,
          ...filterParams,
          ...orderParams,
        ),
      )
    ).rows[0].count;

    // Getting data with pagination
    const data = (
      await this.pool.query(
        format(
          `SELECT *
         FROM (${query}) as results${filter}${order}${limit}`,
          ...filterParams,
          ...orderParams,
          ...limitParams,
        ),
      )
    ).rows;

    return {
      draw: params.draw,
      recordsTotal: parseInt(recordsTotal),
      recordsFiltered: parseInt(recordsFiltered),
      data,
    };
  }
}
