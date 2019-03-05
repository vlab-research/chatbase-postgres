const { Pool } = require('pg');
const mocha = require('mocha')
const chai = require('chai')
const should = chai.should()
const Chatbase = require('./index')

describe('Chatbase Postgres', () => {
  const mockMessage = {
    content: "Hello Chatbase",
    timestamp: Date.now()
  }

  let chatbase;

  before(async () => {
    chatbase = new Chatbase({
      user: 'Marco',
      host: 'localhost',
      database: 'chatbase-test',
      port: 5432
    });

    await chatbase.pool.query('CREATE TABLE messages(id VARCHAR(255) PRIMARY KEY, content VARCHAR(255) NOT NULL, u_key VARCHAR(128) NOT NULL, timestamp VARCHAR(40))');
  })

  afterEach(async () => {
    await chatbase.pool.query('DELETE FROM messages')
  })

  after(async () => {
    await chatbase.pool.query('DROP TABLE messages');
  })

  describe('.get(key)', () => {
    it('should get a list of messages by key', async () => {
      await chatbase.put('123', mockMessage);
      const messages = await chatbase.get('123')
      messages[0].content.should.equal('Hello Chatbase');
    });
  })

  // it('should return undefined when the value doesnt exist', async () => {
  //   const foo = await chatbase.get('nope')
  //   should.not.exist(foo)
  // })

  // it('should add a value via put', async () => {
  //   await chatbase.put('foo', 'baz')
  //   const foo = await chatbase.get('foo')
  //   foo.should.deep.equal(['bar', 'baz'])
  // })

  // it('should unique the values', async () => {
  //   await chatbase.put('foo', 'bar')
  //   const foo = await chatbase.get('foo')
  //   foo.should.deep.equal(['bar'])
  // })

})