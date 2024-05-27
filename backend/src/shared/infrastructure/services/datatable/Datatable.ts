export interface DatatableSearch {
  value: string;
  regex: boolean;
  smart:boolean;
}

export interface DatatableOrder {
  column: number;
  dir: string;
}

export interface DatatableColumn {
  data: string;
  name: string;
  searchable: boolean;
  orderable: boolean;
  search: DatatableSearch;
}

export interface DatatableParams {
  draw: number;
  start: number;
  length: number;
  search: DatatableSearch;
  order: DatatableOrder[];
  columns: DatatableColumn[];
}

export abstract class Datatable {
  abstract getData(params: DatatableParams, query: string): Promise<any>;
}
