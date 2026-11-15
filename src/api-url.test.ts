import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apiOrigin } from './api-url';
test('só aceita uma origem HTTPS para envio do token', () => {
 assert.equal(apiOrigin('https://example.vercel.app/'), 'https://example.vercel.app');
 for (const url of [undefined,'http://example.com','https://user:pass@example.com','https://example.com/path','https://example.com/?x=1','https://example.com/#x','invalid']) assert.throws(()=>apiOrigin(url));
});
