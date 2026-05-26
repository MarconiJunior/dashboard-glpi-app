import mysql from "mysql2/promise";

const globalForDb = globalThis as unknown as { _glpiPool: mysql.Pool };

export const pool =
  globalForDb._glpiPool ??
  mysql.createPool({
    host: process.env.DB_HOST ?? "localhost",
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    timezone: "+00:00",      // retorna datas em UTC
    dateStrings: false,      // retorna objetos Date
    decimalNumbers: true,
  });

if (process.env.NODE_ENV !== "production") globalForDb._glpiPool = pool;
