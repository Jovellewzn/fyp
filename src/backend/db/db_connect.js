const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../db/tournament_app.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.log(err)
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

module.exports = db;