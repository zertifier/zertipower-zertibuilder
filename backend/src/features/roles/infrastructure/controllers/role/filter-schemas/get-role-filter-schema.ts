import { FilterSchema } from "../../../../../../shared/infrastructure/http/HttpUtils";

export const getRolesFilterSchema: Array<FilterSchema> = [
  {
    field: "id",
    value: "integer",
  },
  {
    field: "name",
    value: "string",
  },
];
