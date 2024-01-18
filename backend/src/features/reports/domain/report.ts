import { ReportParam } from "./report-param";
import { ReportColumn } from "./report-column";
import { DateValueObject } from "../../../shared/domain/value-object";

export interface Report {
  id?: number;
  name: string;
  sql: string;
  params: Array<ReportParam>;
  columns: Array<ReportColumn>;
  createdAt?: DateValueObject;
  updatedAt?: DateValueObject;
}
