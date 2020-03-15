const { Pool } = require('pg');
const FHash = require('farmhash');
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

  async get (key) {
    const query = 'SELECT * FROM messages WHERE userid = $1 ORDER BY timestamp ASC'
    const result = await this.pool.query(query, [key]);
    return result.rows.map(r => r.content);
  }

  makeId (message) {
    return FHash.hash32(message);
  }

  async put (key, message, timestamp) {
    const hash = this.makeId(message)

    const query = `INSERT INTO messages(id, userid, content, timestamp)
		   values($1, $2, $3, $4)
		   ON CONFLICT(id) DO NOTHING`;

    return this.pool.query(query,
                           [hash, key, message, timestamp]);
  }

  async writeResponse (vals) {
    const query = `INSERT INTO responses(formid, flowid, userid, question_ref, question_idx, question_text, response, timestamp)
		   values($1, $2, $3, $4, $5, $6, $7, $8)
		   ON CONFLICT(userid, timestamp) DO NOTHING`

  return this.pool.query(query, vals)
}
}

module.exports = Chatbase;
