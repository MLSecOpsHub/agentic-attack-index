// URL resolution for linkcheck, kept separate so it can be unit-tested
// against a local server without running the whole network check.

export const TIMEOUT_MS = 15_000;
// Transient failures that warrant a retry rather than a verdict. Web archives
// (archive.org) rate-limit and 5xx under load, so a single hiccup must not
// declare an otherwise-archived source dead.
export const RETRIES = 2;
export const RETRY_BACKOFF_MS = 1_500;
export const isTransientStatus = (status) => status === 429 || (status >= 500 && status <= 599);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Returns null if the URL resolves, else a short problem string. Transient
// network/timeout errors and 429/5xx responses are retried before giving up.
//
// HEAD is tried first because it is cheap, but a failed HEAD is never a
// verdict on its own: some servers reject HEAD (403/405/501) and others answer
// it with a 404 while serving the page to GET (MSRC's CSAF advisories do). So
// any non-transient HEAD failure is re-checked with GET, and only the GET
// result decides.
export async function resolveUrl(
  url,
  { timeoutMs = TIMEOUT_MS, retries = RETRIES, backoffMs = RETRY_BACKOFF_MS } = {}
) {
  const attempt = async (method) =>
    fetch(url, {
      method,
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs),
      headers: { 'user-agent': 'agentic-attack-index-linkcheck' },
    });
  let lastProblem = 'unknown error';
  for (let i = 0; i <= retries; i++) {
    try {
      let res = await attempt('HEAD');
      if (!res.ok && !isTransientStatus(res.status)) res = await attempt('GET');
      if (res.ok) return null;
      lastProblem = `HTTP ${res.status}`;
      if (!isTransientStatus(res.status)) return lastProblem;
    } catch (e) {
      lastProblem = e.name === 'TimeoutError' ? `timeout after ${timeoutMs}ms` : e.message;
    }
    if (i < retries) await sleep(backoffMs * (i + 1));
  }
  return lastProblem;
}
