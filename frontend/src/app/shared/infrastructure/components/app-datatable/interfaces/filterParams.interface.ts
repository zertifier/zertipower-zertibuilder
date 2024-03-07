export interface filterParams {
	title: string;
	description: string;
	value: string | number;
	type: filterType;
	binarySelector?: boolean;
	defaultTranslation?: String[]; //to translate from 0,1 to active,inactive or similar
	options: option[];
	defaultData: number; // 1 if default, 0 in the other case
}

export enum filterType {
	text,
	number,
	selection,
  datetime
}

export interface option {
	name: string;
	value: string | number;
}

/*

Example:

filterParams: filterParams[] = [
  {
    "title": "name",
    "description": "",
    "value": "",
    "type": 0,
    "defaultData": 0,
    "options": []
  },
  {
    "title": "last name",
    "description": "",
    "value": "",
    "type": 0,
    "defaultData": 0,
    "options": []
  },
  {
    "title": "username",
    "description": "",
    "value": "",
    "type": 0,
    "defaultData": 0,
    "options": []
  },
  {
    "title": "email",
    "description": "",
    "value": "",
    "type": 0,
    "defaultData": 0,
    "options": []
  },
  {
    "title": "type",
    "description": "",
    "value": "",
    "type": 2,
    "defaultData": 1,
    "binarySelector":true,
    "defaultTranslation":["ADMIN","CUSTOMER"],
    "options": [
      {
        "name": "",
        "value": ""
      },
      {
        "name": "ADMIN",
        "value": "ADMIN"
      },
      {
        "name": "CUSTOMER",
        "value": "CUSTOMER"
      },
    ]
  }, {
    "title": "active",
    "description": "",
    "value": "",
    "type": 2,
    "defaultData": 1,
    "binarySelector":true,
    "defaultTranslation":["active","inactive"],
    "options":
      [
        {
          "name": "",
          "value": ""
        },
        {
          "name": "active",
          "value": "1"
        },
        {
          "name": "inactive",
          "value": "0"
        }
      ]
  }
]

*/
