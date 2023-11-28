export enum ReportParamTypes {
  STRING = 'STRING',
  INTEGER = 'INTEGER',
  DECIMAL = 'DECIMAL',
  BOOLEAN = 'BOOLEAN',
  DATE = 'DATE',
}

export interface ReportParam {
  name: string;
  type: ReportParamTypes;
}
