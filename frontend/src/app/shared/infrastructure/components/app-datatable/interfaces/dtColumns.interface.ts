export interface dtColumns {
	title: string; //ex: 'Last name'
	data: string; //ex: 'last_name'
	width: string; //ex: '0px'
}

/*

Example:

//in columns, set id element on edit and delete button column to make it functional

columns: dtColumns[] = [
  {
    title: `Name`,
    data: 'name',
    width: '100px'
  },
  {
    title: `Last name`,
    data: 'last_name',
    width: '100px'
  },
  {
    title: `Username`,
    data: 'username',
    width: '100px'
  },
  {
    title: `Email`,
    data: 'email',
    width: '100px'
  },
  {
    title: `Type`,
    data: 'type',
    width: '100px'
  },
  {
    title: `Active`,
    data: 'active',
    width: '100px'
  },
  {
    title: '',
    data: 'id',
    width: "100px",
  }
];*/
