/**
 * https://allorigins.win/
 * @param {import('./fetchCors.types.ts').FetchCorsInput} url
 * @returns {Promise<import('./fetchCors.types.ts').FetchCorsResponse>}
 */
async function fetchAllOrigins(url, options = {}) {
  const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);

  // extract all for fields below
  const headers = Object.fromEntries(res.headers.entries());
  const ok = res.ok;
  const status = res.status;
  const body = await res.text();

  return {
    headers,
    ok,
    status,
    body,
  };
}

/**
 * @param {import('./fetchCors.types.ts').FetchCorsInput} url
 * @returns {Promise<import('./fetchCors.types.ts').FetchCorsResponse>}
 */
export default function fetchCors(url, options = {}) {
  return fetchAllOrigins(url, options);
}
