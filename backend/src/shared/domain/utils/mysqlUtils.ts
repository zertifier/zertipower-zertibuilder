
const createDeleteQuery = (table:any, id:any) => {
    let query = 'DELETE FROM ' + table + ' ';
    let values = [];
    values.push(id)
    query = query.concat('WHERE id= ?');
    return {query, values};
}

const createUpdateQuery = (table:any, params:any, id:any) => {
    let query = 'UPDATE ' + table + ' SET ';
    let queryValues = [];
    let values = [];
    for (let i = 0; i < params.length; i++) {
        const column = camelToSnake(params[i][0]);
        queryValues.push(' ?? = ? ');
        values.push(column)
        values.push(params[i][1])
    }
    values.push(id)
    query = query.concat(queryValues.join(','))
    query = query.concat('WHERE id=?');
    return {query, values};
}

const createMultipleUpdateQuery = (table:any, params:any, ids:any) => {
    let query = 'UPDATE ' + table + ' SET ';
    let queryValues = [];
    let values = [];
    for (let i = 0; i < params.length; i++) {
        const column = camelToSnake(params[i][0]);
        queryValues.push(`${column} = ? `);
        //values.push(column);
        values.push(params[i][1]);
    }
    let idPlaceholders = [];
    for (let i = 0; i < ids.length; i++) {
        idPlaceholders.push('?');
    }
    query = query.concat(queryValues.join(','));
    query = query.concat(' WHERE id IN (' + idPlaceholders.join(',') + ')');
    values = values.concat(ids);
    return {query, values};
}

const createPostQuery = (table:any, params:any) => {
    let query = 'INSERT INTO ' + table;
    let columns = []
    let queryValues:any = [];
    let values = [];
    for (let i = 0; i < params.length; i++) {
        queryValues.push(' ?');
        columns.push(camelToSnake(params[i][0]))
        values.push(params[i][1])
    }
    queryValues = queryValues.join(',');
    query = query.concat(" (" + columns.join(',') + ") VALUES");
    query = query.concat(" (" + queryValues + ")")
    return {query, values}
}

const createMultiplePostQuery = (table:any, records:any) => {
    let query = 'INSERT INTO ' + table;
    let columns:any[] = [];
    let queryValues = [];
    let values = [];

    for (let i = 0; i < records.length; i++) {
        const record = records[i];

        if (i === 0) {
            // Solo para el primer registro, obtén las columnas
            columns = Object.keys(record).map((col) => camelToSnake(col));
        }

        const recordValues = Object.values(record);
        queryValues.push('(' + Array(recordValues.length).fill('?').join(', ') + ')');
        values.push(...recordValues);
    }

    query = query.concat(' (' + columns.join(', ') + ') VALUES ');
    query = query.concat(queryValues.join(', '));

    return { query, values };
};

const camelToSnake = (camelCaseString: string): string => {
    return camelCaseString.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

module.exports = {
    createMultiplePostQuery,
    createMultipleUpdateQuery,
    createUpdateQuery,
    createPostQuery
}