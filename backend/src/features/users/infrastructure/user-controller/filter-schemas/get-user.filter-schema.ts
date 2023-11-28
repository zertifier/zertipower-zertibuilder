import { FilterSchema } from '../../../../../shared/infrastructure/http/HttpUtils';

export const getUsersFilterSchema: Array<FilterSchema> = [
  {
    field: 'id',
    value: 'integer',
  },
  {
    field: 'username',
    value: 'string',
  },
  {
    field: 'firstname',
    value: 'string',
  },
  {
    field: 'lastname',
    value: 'string',
  },
  {
    field: 'email',
    value: 'string',
  },
  {
    field: 'created_at',
    value: 'date',
  },
  {
    field: 'updated_at',
    value: 'date',
  },
];
