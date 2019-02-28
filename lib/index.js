const { Pool } = require('pg');

class Chatbase {
  constructor() {
    this.pool = new Pool({
      user: process.env.user || argValidation('user'),
      host: process.env.host || argValidation('host'),
      database: process.env.database || argValidation('database'),
      password: process.env.password || undefined,
      port: process.env.port || argValidation('port'),
    })

    this.pool.on('error', (err, client) => {
      throw new Error('Unexpected error on idle client', err);
    })
  }

  // Get method to retrieve the list of messages related to a single user
  get (key) {
    return this.pool.query('SELECT * FROM messages WHERE u_key = $1', [key])
  }

  // Put method to insert a new message related to a single user
  put (key, value) {
    return this.pool.query('INSERT INTO messages(u_key, message) values($1, $2) RETURNING id', [key, value])
  }
}

module.exports = Chatbase;









