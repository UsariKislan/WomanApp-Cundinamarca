const { createPool } = require('./database');

const pool = createPool();

module.exports = pool;
