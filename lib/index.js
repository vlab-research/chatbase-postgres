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

  // Get method to retrieve the list of messages related to a single user
  async get (key) {
    const query = 'SELECT * FROM messages WHERE userid = $1 ORDER BY timestamp ASC'
    const result = await this.pool.query(query, [key]);
    return result.rows.map(r => r.content);
  }

  // Put method to insert a new message related to a single user
  async put (key, message, timestamp) {
    const hash = FHash.hash32(message);

    const query = `INSERT INTO messages(id, userid, content, timestamp)
		   values($1, $2, $3, $4)
		   ON CONFLICT(id) DO NOTHING`;

    return this.pool.query(query,
                           [hash, key, message, timestamp]);
  }
}

module.exports = Chatbase;
