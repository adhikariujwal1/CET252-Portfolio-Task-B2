const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'database.sqlite');

function getDb() {
  return new sqlite3.Database(dbPath);
}

module.exports = { getDb };
