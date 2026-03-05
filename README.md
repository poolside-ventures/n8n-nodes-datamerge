## @datamerge/n8n-nodes-datamerge

Custom n8n community node package for [DataMerge](https://app.datamerge.ai).

This package exposes a single `DataMerge` node aligned with the [DataMerge API](https://api.datamerge.ai) and [documentation](https://www.datamerge.ai/docs/llms.txt).

**Company operations**

- **Start Company Enrichment** — `POST /v1/company/enrich` (domain/company_name, country_code, global_ultimate, list, skip_if_exists, webhook)
- **Get Company Enrichment Result** — `GET /v1/company/enrich/{job_id}/status`
- **Get Company** — `GET /v1/company/get` (by `datamerge_id` or `record_id`, optional `add_to_list`)
- **Get Company Hierarchy** — `GET /v1/company/hierarchy` (datamerge_id, include_names, include_branches, only_subsidiaries, max_level, country_code, page)

**Contact operations**

- **Start Contact Search** — `POST /v1/contact/search` (domains, max_results_per_company, enrich_fields, job_titles, location, webhook)
- **Get Contact Search Status** — `GET /v1/contact/search/{job_id}/status`
- **Get Contact** — `GET /v1/contact/get?record_id=...` (free)

**Lookalike & account**

- **Start Lookalike** — `POST /v1/company/lookalike` (companiesFilters, size, list)
- **Get Lookalike Status** — `GET /v1/company/lookalike/{job_id}/status`
- **Get Credits Balance** — `GET /v1/credits/balance`

## Installation

1. Build the package:

```bash
cd /Users/vjong/Development/datamerge/n8n-nodes-datamerge
npm install
npm run build
```

2. Install the built package into your n8n instance (for example, in a self-hosted setup) from npm once published:

```bash
npm install @datamerge/n8n-nodes-datamerge
```

Restart n8n after installation so that it picks up the new node.

## Credentials

The node uses a single **API Key** credential:

- API Key is sent as: `Authorization: Token <API_KEY>`
- The connection test calls `https://api.datamerge.ai/auth/info` and uses the returned `email` as the connection label.

## Operations

All endpoints and parameters follow the [DataMerge API reference](https://www.datamerge.ai/docs/llms.txt). Enrichment and search are asynchronous: start a job, poll status by job ID, then fetch records by `record_id` (free).


