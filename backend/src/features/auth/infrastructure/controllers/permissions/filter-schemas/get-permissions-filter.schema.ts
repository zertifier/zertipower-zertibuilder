import { FilterSchema } from "../../../../../../shared/infrastructure/http/HttpUtils";

export const getPermissionsFilterSchema: Array<FilterSchema> = [
  {
    field: "resource",
    value: "string",
  },
  {
    field: "action",
    value: "string",
  },
];
