const { Pool } = require('pg');
const mocha = require('mocha');
const chai = require('chai');
const should = chai.should();
const Chatbase = require('./index');
const {ChatbaseValidationError} = require('../utils')

describe('Chatbase Postgres', () => {
  let chatbase;
  let pool;

  before(async () => {
    pool = new Pool({user: 'postgres',
                     host: 'localhost',
                     database: 'postgres',
                     port: 5432});

    try {
      await pool.query('CREATE DATABASE chatbasetest');
    } catch (e) {}

    chatbase = new Chatbase({
      user: 'postgres',
      host: 'localhost',
      database: 'chatbasetest',
      port: 5432
    });

    await chatbase.pool.query('CREATE TABLE IF NOT EXISTS messages(id BIGINT PRIMARY KEY, content VARCHAR NOT NULL, userid VARCHAR NOT NULL, timestamp TIMESTAMPTZ)');
    await chatbase.pool.query('DELETE FROM messages');
  });

  afterEach(async () => {
    await chatbase.pool.query('DELETE FROM messages');
  });

  after(async () => {
    await chatbase.pool.query('DROP TABLE messages');
  });

  describe('.get(key)', () => {
    it('should get a list of messages by key', async () => {
      const mockMessage = '{ "foo": "bar" }';
      await chatbase.put('123', mockMessage, new Date());
      const messages = await chatbase.get('123');
      messages[0].should.equal('{ "foo": "bar" }');
    });

    it('should gets multiple messages from one user', async () => {
      const mockMessages = ['{ "foo": "bar" }', '{ "baz": "qux" }'];
      for (let msg of mockMessages) {
        await chatbase.put('123', msg, new Date());
      };
      const messages = await chatbase.get('123');
      messages[0].should.equal('{ "foo": "bar" }');
      messages[1].should.equal('{ "baz": "qux" }');
    });

    it('should get defaults from env vars', async () => {
      const prev = process.env.CHATBASE_DATABASE;
      process.env.CHATBASE_DATABASE = 'chatbasetest';

      chatbase = new Chatbase({
        user: 'postgres',
        host: 'localhost',
        port: 5432
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

    it('rethrows errors on pool error', async () => {
      class TestError extends Error {};
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
