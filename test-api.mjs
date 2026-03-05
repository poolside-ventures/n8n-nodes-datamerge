#!/usr/bin/env node
/**
 * Local API test for DataMerge. Run with your API key in the environment:
 *   DATAMERGE_API_KEY=your_key node test-api.mjs
 * Do not commit or paste your API key in chat.
 */

const BASE = 'https://api.datamerge.ai';

function authHeaders(key) {
  if (!key || key === 'your_key') {
    throw new Error('Set DATAMERGE_API_KEY in the environment (e.g. DATAMERGE_API_KEY=xxx node test-api.mjs)');
  }
  return {
    Authorization: `Token ${key}`,
    'Content-Type': 'application/json',
  };
}

async function request(method, path, body = null) {
  const key = process.env.DATAMERGE_API_KEY;
  const opts = { method, headers: authHeaders(key) };
  if (body && (method === 'POST' || method === 'PUT')) {
    opts.body = JSON.stringify(body);
  }
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
  const res = await fetch(url, opts);
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}: ${JSON.stringify(data)}`);
  }
  return data;
}

async function main() {
  console.log('Testing DataMerge API (same endpoints as n8n node)...\n');

  // 1. Credential test (same as n8n credential test)
  console.log('1. GET /auth/info (credential test)');
  const info = await request('GET', '/auth/info');
  console.log('   OK:', info?.email ?? info);

  // 2. Credits balance
  console.log('\n2. GET /v1/credits/balance');
  const balance = await request('GET', '/v1/credits/balance');
  console.log('   OK:', balance?.credits_balance ?? balance);

  // 3. Start company enrichment
  console.log('\n3. POST /v1/company/enrich (single domain)');
  const enrich = await request('POST', '/v1/company/enrich', {
    domain: 'stripe.com',
  });
  const jobId = enrich?.job_id;
  if (!jobId) {
    console.log('   Unexpected response:', enrich);
    return;
  }
  console.log('   OK job_id:', jobId);

  // 4. Poll enrichment status (once)
  console.log('\n4. GET /v1/company/enrich/{job_id}/status');
  const status = await request('GET', `/v1/company/enrich/${jobId}/status`);
  console.log('   OK status:', status?.status, status?.record_ids ? `record_ids: ${status.record_ids.length}` : '');

  // 5. Get company by datamerge_id (if we have one from status)
  const recordIds = status?.record_ids || [];
  if (recordIds.length > 0) {
    console.log('\n5. GET /v1/company/get?record_id=... (free)');
    const getCompany = await request('GET', `/v1/company/get?record_id=${encodeURIComponent(recordIds[0])}`);
    console.log('   OK:', getCompany?.record?.legal_name ?? getCompany?.record?.domain ?? getCompany);
  } else {
    console.log('\n5. (Skipping get company — no record_ids yet; job may still be processing)');
  }

  console.log('\nAll checks passed.');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
