const { Pool } = require('pg');
const { ChatbaseValidationError } = require('../utils');

class Chatbase {
  constructor({ user = process.env.CHATBASE_USER,
    host = process.env.CHATBASE_HOST,
    database = process.env.CHATBASE_DATABASE,
    password = process.env.CHATBASE_PASSWORD,
    port = process.env.CHATBASE_PORT } = {}) {

    if (!port || !host || !database) {
      throw new ChatbaseValidationError(`(database, port, host)
	are strictly required for chatbase-postgres!`);
    }

    this.pool = new Pool({ user, host, database, password, port });

    this.pool.on('error', (err, client) => { throw err });
  }

  async get(key, limit) {

    let query = `
      SELECT * FROM messages 
      LEFT JOIN (SELECT userid, message_pointer FROM states WHERE userid = $1) USING (userid) 
      WHERE userid = $1 
      AND (message_pointer IS NULL OR message_pointer <= timestamp)
      ORDER BY TIMESTAMP ASC`

    if (limit) {
      query = query + ` limit ${limit}`
    }

    const result = await this.pool.query(query, [key]);

    return result.rows.map(r => r.content);
  }

  // Put method to insert a new message related to a single user
  async put(key, message, timestamp) {

    const query = `INSERT INTO messages(userid, content, timestamp)
		   values($1, $2, $3)`;

    return this.pool.query(query,
      [key, message, timestamp]);
  }
}

module.exports = Chatbase;
