import test from 'node:test';
import assert from 'node:assert/strict';
import { validateStartupEnv, getMongoUri } from '../utils/startupValidation.js';

test('getMongoUri accepts MONGO_URI and MONGODB_URI', () => {
  const originalMongo = process.env.MONGO_URI;
  const originalMongoDb = process.env.MONGODB_URI;

  process.env.MONGO_URI = 'mongodb://localhost:27017/a';
  process.env.MONGODB_URI = '';
  assert.equal(getMongoUri(), 'mongodb://localhost:27017/a');

  process.env.MONGO_URI = '';
  process.env.MONGODB_URI = 'mongodb://localhost:27017/b';
  assert.equal(getMongoUri(), 'mongodb://localhost:27017/b');

  process.env.MONGO_URI = originalMongo;
  process.env.MONGODB_URI = originalMongoDb;
});

test('validateStartupEnv reports missing production secrets', () => {
  const snapshot = { ...process.env };
  process.env.NODE_ENV = 'production';
  process.env.MONGO_URI = '';
  process.env.MONGODB_URI = '';
  process.env.JWT_SECRET = 'short';
  process.env.GOOGLE_CLIENT_ID = '';
  process.env.CLIENT_URL = '';
  process.env.INTERNAL_API_KEY = '';
  process.env.AI_SERVICE_URL = '';

  const errors = validateStartupEnv();
  assert.ok(errors.some((message) => message.includes('MONGO_URI')));
  assert.ok(errors.some((message) => message.includes('JWT_SECRET')));
  assert.ok(errors.some((message) => message.includes('INTERNAL_API_KEY')));

  Object.assign(process.env, snapshot);
});
