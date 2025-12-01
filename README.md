## @datamerge/n8n-nodes-datamerge

Custom n8n community node package for [DataMerge](https://app.datamerge.ai).

This package exposes a single `DataMerge` node with multiple operations:

- `Start Company Enrichment`
- `Get Company Enrichment Result`
- `Get Company`
- `Get Company Hierarchy`

The operations, fields, and response shaping are designed to mirror the DataMerge API as closely as possible.

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

The `DataMerge` node exposes the following operations:

- **Start Company Enrichment**: `POST /v1/company/enrich`
- **Get Company Enrichment Result**: `GET /v1/job/{job_id}/status`
- **Get Company**: `GET /v1/company/get`
- **Get Company Hierarchy**: `GET /v1/company/hierarchy`

Input fields, validation rules, and response shaping are modeled after the DataMerge API.


