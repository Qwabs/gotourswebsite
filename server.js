const express = require('express');
const { query, transaction, testConnection } = require('./db');

const app = express();
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────

// Health check
app.get('/health', async (req, res) => {
  try {
    await query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET all records from a table
// Example: GET /api/tours
app.get('/api/:table', async (req, res) => {
  const { table } = req.params;

  // Basic allowlist to prevent arbitrary table access
  const allowedTables = ['tours', 'bookings', 'users'];
  if (!allowedTables.includes(table)) {
    return res.status(403).json({ error: 'Table not allowed' });
  }

  try {
    const rows = await query(`SELECT * FROM ??`, [table]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET a single record by ID
// Example: GET /api/tours/3
app.get('/api/:table/:id', async (req, res) => {
  const { table, id } = req.params;

  const allowedTables = ['tours', 'bookings', 'users'];
  if (!allowedTables.includes(table)) {
    return res.status(403).json({ error: 'Table not allowed' });
  }

  try {
    const rows = await query(`SELECT * FROM ?? WHERE id = ?`, [table, id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST — create a new record
// Example: POST /api/bookings  { tour_id, guest_name, guests, start_date, ... }
app.post('/api/:table', async (req, res) => {
  const { table } = req.params;

  const allowedTables = ['tours', 'bookings', 'users'];
  if (!allowedTables.includes(table)) {
    return res.status(403).json({ error: 'Table not allowed' });
  }

  const data = req.body;
  if (!data || Object.keys(data).length === 0) {
    return res.status(400).json({ error: 'Request body is empty' });
  }

  const columns = Object.keys(data);
  const values  = Object.values(data);
  const placeholders = columns.map(() => '?').join(', ');

  try {
    const result = await query(
      `INSERT INTO ?? (${columns.map(() => '??').join(', ')}) VALUES (${placeholders})`,
      [table, ...columns, ...values]
    );
    res.status(201).json({ id: result.insertId, ...data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT — update an existing record by ID
// Example: PUT /api/bookings/5  { guests: 8 }
app.put('/api/:table/:id', async (req, res) => {
  const { table, id } = req.params;

  const allowedTables = ['tours', 'bookings', 'users'];
  if (!allowedTables.includes(table)) {
    return res.status(403).json({ error: 'Table not allowed' });
  }

  const data = req.body;
  if (!data || Object.keys(data).length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  const setClause = Object.keys(data).map(() => '?? = ?').join(', ');
  const setValues = Object.entries(data).flat();

  try {
    const result = await query(
      `UPDATE ?? SET ${setClause} WHERE id = ?`,
      [table, ...setValues, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE — remove a record by ID
// Example: DELETE /api/bookings/5
app.delete('/api/:table/:id', async (req, res) => {
  const { table, id } = req.params;

  const allowedTables = ['tours', 'bookings', 'users'];
  if (!allowedTables.includes(table)) {
    return res.status(403).json({ error: 'Table not allowed' });
  }

  try {
    const result = await query(`DELETE FROM ?? WHERE id = ?`, [table, id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Custom Query Endpoint (for complex queries) ──────────────────────────────

// POST /api/query  { sql: "SELECT ...", params: [] }
// ⚠️  Restrict access to trusted roles in production — never expose to public users
app.post('/api/query', async (req, res) => {
  const { sql: rawSql, params = [] } = req.body;

  if (!rawSql) return res.status(400).json({ error: 'sql field is required' });

  // Block any write operations through this endpoint
  const forbidden = /^\s*(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE)/i;
  if (forbidden.test(rawSql)) {
    return res.status(403).json({ error: 'Only SELECT queries are allowed here' });
  }

  try {
    const rows = await query(rawSql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 404 fallback ─────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Start Server ─────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;

testConnection().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
});
