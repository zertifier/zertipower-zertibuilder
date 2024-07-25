const mysql = require('mysql2/promise');

    const dbConnection = mysql.createPool({
        // host: "46.253.45.22",
        // user: "root",
        // password: "Meg@tr@IPFS_7a7s7d7f7g8h8j8k8l",
        // database: "",
        uri: process.env.DATABASE_URL,
        connectionLimit:25
    });

module.exports = {
    dbConnection
}
