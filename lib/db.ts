// Conexão direta com o banco MySQL via mysql2.
// O Prisma 7 ainda não tem @prisma/adapter-mysql disponível no npm;
// como todas as queries do projeto são SQL puro, mysql2 é a solução mais direta.

import mysql from "mysql2/promise"

const globalForDb = globalThis as unknown as { pool: mysql.Pool }

export const pool =
  globalForDb.pool ??
  mysql.createPool({
    host: process.env.DB_HOST ?? "localhost",
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    timezone: "+00:00",        // retorna datas em UTC
    dateStrings: false,        // retorna Date objects (igual ao comportamento do Prisma)
    decimalNumbers: true,
  })

if (process.env.NODE_ENV !== "production") globalForDb.pool = pool
