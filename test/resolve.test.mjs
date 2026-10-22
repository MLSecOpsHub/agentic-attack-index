// Unit tests for linkcheck's URL resolution, against a local server so they
// run offline inside `npm test`.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { resolveUrl } from '../scripts/resolve.mjs';

let server;
let base;
let flakyHits = 0;

before(async () => {
  server = http.createServer((req, res) => {
    const { method, url } = req;
    if (url === '/ok') return res.writeHead(200).end('ok');
    // MSRC CSAF behaviour: 404 to HEAD, 200 to GET.
    if (url === '/head-404') return res.writeHead(method === 'HEAD' ? 404 : 200).end();
    // Servers that reject HEAD outright.
    if (url === '/head-405') return res.writeHead(method === 'HEAD' ? 405 : 200).end();
    if (url === '/gone') return res.writeHead(404).end();
    if (url === '/forbidden') return res.writeHead(403).end();
    // Rate-limited once, then fine: must be retried, not reported dead.
    if (url === '/flaky') return res.writeHead(flakyHits++ === 0 ? 429 : 200).end();
    res.writeHead(500).end();
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

const fast = { timeoutMs: 2_000, retries: 2, backoffMs: 1 };

test('resolveUrl: a 200 resolves', async () => {
  assert.equal(await resolveUrl(`${base}/ok`, fast), null);
});

test('resolveUrl: HEAD 404 but GET 200 resolves (MSRC CSAF advisories)', async () => {
  assert.equal(await resolveUrl(`${base}/head-404`, fast), null);
});

test('resolveUrl: HEAD 405 falls back to GET', async () => {
  assert.equal(await resolveUrl(`${base}/head-405`, fast), null);
});

test('resolveUrl: a page that 404s to GET too is reported dead', async () => {
  assert.equal(await resolveUrl(`${base}/gone`, fast), 'HTTP 404');
});

test('resolveUrl: a page that 403s to GET too is reported, not resolved', async () => {
  assert.equal(await resolveUrl(`${base}/forbidden`, fast), 'HTTP 403');
});

test('resolveUrl: a 429 is retried rather than reported', async () => {
  assert.equal(await resolveUrl(`${base}/flaky`, fast), null);
});

test('resolveUrl: persistent 5xx is reported after retries', async () => {
  assert.equal(await resolveUrl(`${base}/broken`, fast), 'HTTP 500');
});
