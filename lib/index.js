const { Pool } = require('pg');
const FHash = require('farmhash');

const { getRandomSeed, validationError } = require('../utils');

class Chatbase {
  constructor({
      user = process.env.DB_USER,
      host = process.env.DB_HOST,
      database = process.env.DB_DATABASE,
      password = process.env.DB_PASSWORD,
      port = process.env.DB_PORT
    } = validationError()) {

    this.pool = new Pool({
      user,
      host,
      database,
      password,
      port
    })

    this.pool.on('error', (err, client) => {
      throw new Error('Unexpected error on idle client', err);
    })
  }

  // Get method to retrieve the list of messages related to a single user
  async get (key) {
    const result = await this.pool.query('SELECT * FROM messages WHERE u_key = $1 ORDER BY timestamp ASC', [key]);
    return result.rows;
  }

  // Put method to insert a new message related to a single user
  async put (key, message) {
    let exists = { rows: [true]};
    let hash = '';
    // Generate a new hash in case an existing one is found as unique id in the database
    while (exists.rows.length) {
      hash = FHash.hash64WithSeed(JSON.stringify(message), getRandomSeed());
      exists = await this.pool.query('SELECT id FROM messages WHERE id = $1', [hash]);
    }
    return this.pool.query(
      'INSERT INTO messages(id, u_key, content, timestamp) values($1, $2, $3, $4) RETURNING id', 
      [hash, key, message.content, message.timestamp]
    );
  }
}

module.exports = Chatbase;
