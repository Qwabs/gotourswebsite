// db.js — Database connection module
// Exports a shared pool and query helper used by server.js

const mysql = require('mysql2/promise');

// ─── Configuration ────────────────────────────────────────────────────────────
// Values are read from environment variables (.env) with safe fallbacks.
// Never hard-code credentials in production.

const dbConfig = {
  host:              process.env.DB_HOST     || 'localhost',
  port:              process.env.DB_PORT     || 3306,
  user:              process.env.DB_USER     || 'root',
  password:          process.env.DB_PASSWORD || '',
  database:          process.env.DB_NAME     || 'tours_db',
  waitForConnections: true,
  connectionLimit:   10,   // max simultaneous connections in the pool
  queueLimit:        0,    // 0 = unlimited queued requests
};

// ─── Pool ─────────────────────────────────────────────────────────────────────
// A pool reuses connections instead of opening a new one for every request.

const pool = mysql.createPool(dbConfig);

// ─── Connection Test ──────────────────────────────────────────────────────────

async function testConnection() {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('✅  MySQL connected —', dbConfig.database, '@', dbConfig.host);
  } catch (err) {
    console.error('❌  MySQL connection failed:', err.message);
    process.exit(1);       // stop the server if the DB is unreachable
  } finally {
    if (connection) connection.release();
  }
}

// ─── Query Helper ─────────────────────────────────────────────────────────────
// Always use parameterised queries (the params array) — never interpolate
// user input directly into SQL strings.
//
// Usage:
//   const rows = await query('SELECT * FROM tours WHERE id = ?', [id]);

async function query(sql, params = []) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (err) {
    console.error('DB query error:', err.message);
    console.error('  SQL :', sql);
    console.error('  Params:', params);
    throw err;    // re-throw so route handlers can return a proper HTTP error
  }
}

// ─── Transaction Helper ───────────────────────────────────────────────────────
// Use when multiple queries must all succeed or all roll back.
//
// Usage:
//   const result = await transaction(async (conn) => {
//     await conn.execute('INSERT INTO bookings ...', [...]);
//     await conn.execute('UPDATE tours SET seats = seats - ? WHERE id = ?', [n, id]);
//     return { success: true };
//   });

async function transaction(callback) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = { pool, query, transaction, testConnection };
