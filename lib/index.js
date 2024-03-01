const { Pool } = require('pg');
const {ChatbaseValidationError} = require('../utils');

class Chatbase {
  constructor({user = process.env.CHATBASE_USER,
               host = process.env.CHATBASE_HOST,
               database = process.env.CHATBASE_DATABASE,
               password = process.env.CHATBASE_PASSWORD,
               port = process.env.CHATBASE_PORT} = {}) {

    if (!port || !host || !database) {
      throw new ChatbaseValidationError(`(database, port, host)
	are strictly required for chatbase-postgres!`);
    }

    this.pool = new Pool({user,host,database,password,port});

    this.pool.on('error', (err, client) => { throw err });
  }

  async get(key, limit) {
    let query = 'SELECT * FROM messages WHERE userid = $1 ORDER BY timestamp ASC'
    if (limit) {
      query = query + ` limit ${limit}`
    }
    const result = await this.pool.query(query, [key]);
    return result.rows.map(r => r.content);
  }

  async put (key, message, timestamp) {
    const query = `INSERT INTO messages(userid, content, timestamp)
		   values($1, $2, $3)
		   ON CONFLICT(hsh, userid) DO NOTHING`;

    return this.pool.query(query,
                           [key, message, timestamp]);
  }

  async writeResponse (vals) {
    const query = `INSERT INTO responses(formid, flowid, userid, question_ref, question_idx, question_text, response, timestamp)
		   values($1, $2, $3, $4, $5, $6, $7, $8)
		   ON CONFLICT(userid, timestamp) DO NOTHING`

  return this.pool.query(query, vals)
}
}

module.exports = Chatbase;
