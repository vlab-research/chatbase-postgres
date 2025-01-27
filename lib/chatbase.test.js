const { Pool } = require('pg');
const mocha = require('mocha');
const chai = require('chai');
const should = chai.should();
const Chatbase = require('./index');
const { ChatbaseValidationError } = require('../utils')

describe('Chatbase Postgres', () => {
  let chatbase;
  let pool;

  before(async () => {
    pool = new Pool({
      user: 'root',
      host: 'localhost',
      database: 'chatroach',
      port: 5433
    });

    chatbase = new Chatbase({
      user: 'root',
      host: 'localhost',
      database: 'chatroach',
      port: 5433
    });

    await chatbase.pool.query('DELETE FROM messages');
  });

  afterEach(async () => {
    await pool.query('DELETE FROM messages');
    await pool.query('DELETE FROM states');
  });

  describe('.get(key)', () => {
    it('should get a list of messages by key', async () => {
      const mockMessage = '{ "foo": "bar" }';
      await chatbase.put('123', mockMessage, new Date());
      const messages = await chatbase.get('123');
      messages[0].should.equal('{ "foo": "bar" }');
    });

    it('gets multiple messages from one user', async () => {
      const mockMessages = ['{ "foo": "bar" }', '{ "baz": "qux" }'];
      for (let msg of mockMessages) {
        await chatbase.put('123', msg, new Date());
      };
      const messages = await chatbase.get('123');
      messages[0].should.equal('{ "foo": "bar" }');
      messages[1].should.equal('{ "baz": "qux" }');
    });


    it('gets messages after pointer only', async () => {
      const now = new Date()
      const now_1 = new Date(+now + 3600000)
      const now_2 = new Date(+now_1 + 3600000)

      const mockMessages = [[{ "foo": "bar" }, now],
      [{ "foo": "baz" }, now_1],
      [{ "foo": "qux" }, now_2]];

      for (let [msg, date] of mockMessages) {
        await chatbase.put('123', JSON.stringify(msg), date);
      };

      const insertStates = `INSERT INTO
                            states(userid, pageid, updated, current_state, state_json)
                            VALUES ($1, $2, $3, $4, $5)`

      const state = { pointer: +now_1 }
      await chatbase.pool.query(insertStates, ["123", "bar", now, "QOUT", JSON.stringify(state)])

      const messages = await chatbase.get('123');

      messages.length.should.equal(2)
      messages[0].should.equal('{"foo":"baz"}');
      messages[1].should.equal('{"foo":"qux"}');
    });

    it('ignores non-existent and null pointers', async () => {
      const now = new Date()
      const now_1 = new Date(+now + 3600000)
      const now_2 = new Date(+now_1 + 3600000)

      const mockMessages = [[{ "foo": "bar" }, now],
      [{ "foo": "baz" }, now_1],
      [{ "foo": "qux" }, now_2]];

      for (let [msg, date] of mockMessages) {
        await chatbase.put('123', JSON.stringify(msg), date);
      };

      const insertStates = `INSERT INTO
                            states(userid, pageid, updated, current_state, state_json)
                            VALUES ($1, $2, $3, $4, $5)`

      const state = { pointer: undefined }
      await chatbase.pool.query(insertStates, ["123", "bar", now, "QOUT", JSON.stringify(state)])

      const messages = await chatbase.get('123');
      messages.length.should.equal(3)
    });

    it('should get defaults from env vars', async () => {
      const prev = process.env.CHATBASE_DATABASE;
      process.env.CHATBASE_DATABASE = 'chatroach';

      chatbase = new Chatbase({
        user: 'root',
        host: 'localhost',
        port: 5433
      });

      const mockMessage = '{ "foo": "bar" }';
      await chatbase.put('123', mockMessage, new Date());
      const messages = await chatbase.get('123');
      messages[0].should.equal('{ "foo": "bar" }');

      process.env.CHATBASE_DATABASE = prev;
    });

    it('throws validation error if no host', async () => {
      const c = () => new Chatbase(host = undefined);
      c.should.throw(ChatbaseValidationError);
    })

    it('throws if operation fails (format)', async () => {
      try {
        await chatbase.put('foo', 'bar', 'baz')
      } catch (e) {
        error = e
      }
      error.should.be.instanceof(Error)
    })

    it('throws if operation fails (permission denied)', async () => {
      await pool.query('CREATE USER chatbase');

      let chatbase = new Chatbase({
        user: 'chatbase',
        host: 'localhost',
        database: 'chatroach',
        port: 5433
      });

      let error;

      try {
        await chatbase.put('foo', 'bar', new Date())
      } catch (e) {
        error = e
      }

      error.should.be.instanceof(Error)
      await pool.query('DROP USER chatbase');
    })

    it('rethrows errors on pool error', async () => {
      class TestError extends Error { };
      let error;

      try {
        chatbase.pool.emit('error', new TestError('foo'));
      } catch (e) {
        error = e;
      }

      error.should.be.instanceof(TestError);
    });
  });
});
