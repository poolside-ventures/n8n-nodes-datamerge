import type {
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

export class DataMerge implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'DataMerge',
		name: 'dataMerge',
		// Use a standard FontAwesome icon to avoid requiring a custom SVG asset
		icon: 'fa:building',
		group: ['transform'],
		version: 2,
		description: 'Enrich companies and contacts, search contacts, find lookalikes via the DataMerge API',
		defaults: {
			name: 'DataMerge',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'dataMergeApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Start Company Enrichment',
						value: 'startCompanyEnrichment',
						description:
							'Initiate an asynchronous company enrichment job (returns job ID)',
					},
					{
						name: 'Get Company Enrichment Result',
						value: 'getCompanyEnrichmentResult',
						description:
							'Retrieve the result of a completed company enrichment job',
					},
					{
						name: 'Get Company',
						value: 'getCompany',
						description: 'Fetch company information by company ID',
					},
					{
						name: 'Get Company Hierarchy',
						value: 'getCompanyHierarchy',
						description:
							'Get companies in the same global ultimate hierarchy for a given company ID',
					},
					{
						name: 'Start Contact Search',
						value: 'startContactSearch',
						description:
							'Search for contacts at companies by domain (async, returns job ID)',
					},
					{
						name: 'Get Contact Search Status',
						value: 'getContactSearchStatus',
						description: 'Poll contact search job status and get record IDs',
					},
					{
						name: 'Get Contact',
						value: 'getContact',
						description: 'Fetch a contact by record ID (free)',
					},
					{
						name: 'Start Lookalike',
						value: 'startLookalike',
						description:
							'Find similar companies from seed domains (async, returns job ID)',
					},
					{
						name: 'Get Lookalike Status',
						value: 'getLookalikeStatus',
						description: 'Poll lookalike job status and get record IDs',
					},
					{
						name: 'Get Credits Balance',
						value: 'getCreditsBalance',
						description: 'Get current credits balance',
					},
				],
				default: 'startCompanyEnrichment',
			},

			// Start Company Enrichment fields
			{
				displayName: 'Domain',
				name: 'domain',
				type: 'string',
				default: '',
				placeholder: 'google.com',
				description:
					'Domain to search for entities. Accepts formats like google.com, www.google.com, or full URLs with protocol',
				displayOptions: {
					show: {
						operation: ['startCompanyEnrichment'],
					},
				},
			},
			{
				displayName: 'Company Name',
				name: 'company_name',
				type: 'string',
				default: '',
				placeholder: 'Google LLC',
				description:
					"Company legal name to search directly in the database. It's recommended to combine with Country Code for better results.",
				displayOptions: {
					show: {
						operation: ['startCompanyEnrichment'],
					},
				},
			},
			{
				displayName: 'Country Codes',
				name: 'country_code',
				type: 'string',
				default: [],
				typeOptions: {
					multipleValues: true,
				},
				description:
					"Return the first company from these countries that matches. Cannot be used together with Global Ultimate. ISO 3166-1 alpha-2 codes, e.g. 'DE' or 'FR'.",
				displayOptions: {
					show: {
						operation: ['startCompanyEnrichment'],
					},
				},
			},
			{
				displayName: 'Global Ultimate',
				name: 'global_ultimate',
				type: 'boolean',
				default: false,
				description:
					'Return the global ultimate parent company instead of the matched company. Only works with domain enrichment, not with Company Name, and cannot be used with Country Codes.',
				displayOptions: {
					show: {
						operation: ['startCompanyEnrichment'],
					},
				},
			},
			{
				displayName: 'Webhook URL',
				name: 'webhook',
				type: 'string',
				default: '',
				placeholder: 'https://your-app.com/webhook',
				description:
					'URL to send the results to when processing is complete. If not provided, results will be available via polling.',
				displayOptions: {
					show: {
						operation: ['startCompanyEnrichment'],
					},
				},
			},
			{
				displayName: 'List Slug',
				name: 'list',
				type: 'string',
				default: '',
				placeholder: 'my-companies',
				description:
					'Optional list slug to add enriched companies to (e.g. my-companies).',
				displayOptions: {
					show: {
						operation: ['startCompanyEnrichment'],
					},
				},
			},
			{
				displayName: 'Skip If Exists',
				name: 'skip_if_exists',
				type: 'boolean',
				default: false,
				description:
					'When adding to a list, skip domains that already exist in the list (avoids charging credits for duplicates).',
				displayOptions: {
					show: {
						operation: ['startCompanyEnrichment'],
					},
				},
			},

			// Get Company Enrichment Result
			{
				displayName: 'Job ID',
				name: 'job_id',
				type: 'string',
				default: '',
				placeholder: '88280621-23ff-4506-a157-8e1403d7aa73',
				description:
					'The job ID returned from the Start Company Enrichment operation',
				displayOptions: {
					show: {
						operation: ['getCompanyEnrichmentResult'],
					},
				},
				required: true,
			},

			// Get Company
			{
				displayName: 'Lookup By',
				name: 'get_company_by',
				type: 'options',
				options: [
					{
						name: 'DataMerge ID',
						value: 'datamerge_id',
						description: 'Company ID (e.g. DM001283124635) — charges 1 credit',
					},
					{
						name: 'Record ID',
						value: 'record_id',
						description: 'Your record UUID from a previous enrichment — free',
					},
				],
				default: 'datamerge_id',
				displayOptions: {
					show: {
						operation: ['getCompany'],
					},
				},
			},
			{
				displayName: 'DataMerge ID',
				name: 'datamerge_id',
				type: 'string',
				default: '',
				placeholder: 'DM001283124635',
				description: 'The DataMerge company ID (e.g. DM001283124635)',
				displayOptions: {
					show: {
						operation: ['getCompany'],
						get_company_by: ['datamerge_id'],
					},
				},
				required: true,
			},
			{
				displayName: 'Record ID',
				name: 'record_id',
				type: 'string',
				default: '',
				placeholder: '550e8400-e29b-41d4-a716-446655440000',
				description: 'Record UUID returned from a previous enrichment job',
				displayOptions: {
					show: {
						operation: ['getCompany'],
						get_company_by: ['record_id'],
					},
				},
				required: true,
			},
			{
				displayName: 'Add to List',
				name: 'add_to_list',
				type: 'string',
				default: '',
				placeholder: 'my-companies',
				description:
					'Optional list slug to add the company to (only when using DataMerge ID)',
				displayOptions: {
					show: {
						operation: ['getCompany'],
						get_company_by: ['datamerge_id'],
					},
				},
			},

			// Get Company Hierarchy
			{
				displayName: 'DataMerge ID',
				name: 'hierarchy_datamerge_id',
				type: 'string',
				default: '',
				placeholder: 'DM001283124635',
				description:
					'The DataMerge company ID used as the root of the hierarchy.',
				displayOptions: {
					show: {
						operation: ['getCompanyHierarchy'],
					},
				},
				required: true,
			},
			{
				displayName: 'Country Codes',
				name: 'hierarchy_country_code',
				type: 'string',
				default: [],
				typeOptions: {
					multipleValues: true,
				},
				description:
					'Filter results to only include companies from specified countries (ISO 3166-1 alpha-2 codes, e.g., US, GB, DE).',
				displayOptions: {
					show: {
						operation: ['getCompanyHierarchy'],
					},
				},
			},
			{
				displayName: 'Include Branches',
				name: 'include_branches',
				type: 'boolean',
				default: false,
				description:
					'Whether to include branches and divisions in results (default: false).',
				displayOptions: {
					show: {
						operation: ['getCompanyHierarchy'],
					},
				},
			},
			{
				displayName: 'Include Company Names',
				name: 'include_names',
				type: 'boolean',
				default: false,
				description:
					'Include company names in results (charges 1 credit per request when true, default: false).',
				displayOptions: {
					show: {
						operation: ['getCompanyHierarchy'],
					},
				},
			},
			{
				displayName: 'Only Subsidiaries',
				name: 'only_subsidiaries',
				type: 'boolean',
				default: false,
				description:
					'When true, only return companies that are subsidiaries of the provided company (default: false).',
				displayOptions: {
					show: {
						operation: ['getCompanyHierarchy'],
					},
				},
			},
			{
				displayName: 'Max Level',
				name: 'max_level',
				type: 'number',
				typeOptions: {
					minValue: 1,
				},
				default: 0,
				description:
					'Maximum hierarchy level to return (0 = no limit). Optional.',
				displayOptions: {
					show: {
						operation: ['getCompanyHierarchy'],
					},
				},
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				typeOptions: {
					minValue: 1,
				},
				default: 1,
				description: 'Page number (default: 1).',
				displayOptions: {
					show: {
						operation: ['getCompanyHierarchy'],
					},
				},
			},

			// Start Contact Search
			{
				displayName: 'Domains',
				name: 'contact_search_domains',
				type: 'string',
				default: '',
				placeholder: 'stripe.com, shopify.com',
				description:
					'Comma-separated domains to search for contacts at (or use expressions for multiple)',
				displayOptions: {
					show: {
						operation: ['startContactSearch'],
					},
				},
				required: true,
			},
			{
				displayName: 'Max Results Per Company',
				name: 'max_results_per_company',
				type: 'number',
				typeOptions: { minValue: 1 },
				default: 5,
				description: 'Maximum number of contacts to return per company',
				displayOptions: {
					show: {
						operation: ['startContactSearch'],
					},
				},
			},
			{
				displayName: 'Enrich Fields',
				name: 'enrich_fields',
				type: 'multiOptions',
				options: [
					{ name: 'Emails', value: 'contact.emails' },
					{ name: 'Phones', value: 'contact.phones' },
				],
				default: ['contact.emails'],
				description: 'At least one required. Data to enrich for each contact.',
				displayOptions: {
					show: {
						operation: ['startContactSearch'],
					},
				},
				required: true,
			},
			{
				displayName: 'Job Titles (Include)',
				name: 'job_titles_include',
				type: 'json',
				default: '{"1": ["CEO", "CTO"], "2": ["VP Engineering"]}',
				description:
					'Priority tiers: "1" matched before "2". Keys are tier numbers, values are arrays of job title strings.',
				displayOptions: {
					show: {
						operation: ['startContactSearch'],
					},
				},
			},
			{
				displayName: 'Job Titles (Exclude)',
				name: 'job_titles_exclude',
				type: 'json',
				default: '["Intern", "Assistant"]',
				description: 'Array of job titles to exclude',
				displayOptions: {
					show: {
						operation: ['startContactSearch'],
					},
				},
			},
			{
				displayName: 'Location (Include)',
				name: 'location_include',
				type: 'json',
				default: '[{"type": "country", "value": "United States"}]',
				description:
					'Array of {type, value}. type: country, region, or city.',
				displayOptions: {
					show: {
						operation: ['startContactSearch'],
					},
				},
			},
			{
				displayName: 'Webhook URL',
				name: 'contact_search_webhook',
				type: 'string',
				default: '',
				description: 'URL to receive results when job completes',
				displayOptions: {
					show: {
						operation: ['startContactSearch'],
					},
				},
			},

			// Get Contact Search Status
			{
				displayName: 'Job ID',
				name: 'contact_search_job_id',
				type: 'string',
				default: '',
				placeholder: '88280621-23ff-4506-a157-8e1403d7aa73',
				description: 'Job ID from Start Contact Search',
				displayOptions: {
					show: {
						operation: ['getContactSearchStatus'],
					},
				},
				required: true,
			},

			// Get Contact
			{
				displayName: 'Record ID',
				name: 'contact_record_id',
				type: 'string',
				default: '',
				placeholder: '550e8400-e29b-41d4-a716-446655440000',
				description: 'Contact record UUID from a previous search/enrich job',
				displayOptions: {
					show: {
						operation: ['getContact'],
					},
				},
				required: true,
			},

			// Start Lookalike
			{
				displayName: 'Companies Filters (JSON)',
				name: 'companies_filters',
				type: 'json',
				default: '{"lookalikeDomains": ["stripe.com"], "primaryLocations": {"includeCountries": ["us", "gb"]}, "companySizes": ["51-200", "201-500"], "revenues": ["10-50M", "50-100M"]}',
				description:
					'Filters: lookalikeDomains, primaryLocations (includeCountries/excludeCountries), companySizes, revenues, yearFounded (min/max)',
				displayOptions: {
					show: {
						operation: ['startLookalike'],
					},
				},
				required: true,
			},
			{
				displayName: 'Size',
				name: 'lookalike_size',
				type: 'number',
				typeOptions: { minValue: 1 },
				default: 50,
				description: 'Number of lookalike companies to return',
				displayOptions: {
					show: {
						operation: ['startLookalike'],
					},
				},
			},
			{
				displayName: 'List Slug',
				name: 'lookalike_list',
				type: 'string',
				default: '',
				description: 'Optional list slug to add results to',
				displayOptions: {
					show: {
						operation: ['startLookalike'],
					},
				},
			},

			// Get Lookalike Status
			{
				displayName: 'Job ID',
				name: 'lookalike_job_id',
				type: 'string',
				default: '',
				placeholder: '88280621-23ff-4506-a157-8e1403d7aa73',
				description: 'Job ID from Start Lookalike',
				displayOptions: {
					show: {
						operation: ['getLookalikeStatus'],
					},
				},
				required: true,
			},
		],
	};

	async execute(): Promise<INodeExecutionData[][]> {
		const self = this as any;
		const items = self.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = self.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				if (operation === 'startCompanyEnrichment') {
					const body: IDataObject = {};

					const domain = self.getNodeParameter('domain', i, '') as string;
					const companyName = self.getNodeParameter(
						'company_name',
						i,
						'',
					) as string;

					if (!domain && !companyName) {
						throw new NodeOperationError(self.getNode(), 'Either Domain or Company Name must be provided', {
							itemIndex: i,
						});
					}

					if (domain) {
						body.domain = domain;
					}
					if (companyName) {
						body.company_name = companyName;
					}

					const countryCodes = self.getNodeParameter(
						'country_code',
						i,
						[],
					) as string[];
					if (countryCodes && countryCodes.length > 0) {
						body.country_code = countryCodes;
					}

					const globalUltimate = self.getNodeParameter(
						'global_ultimate',
						i,
						false,
					) as boolean;
					if (globalUltimate !== undefined) {
						body.global_ultimate = globalUltimate;
					}

					const webhook = self.getNodeParameter('webhook', i, '') as string;
					if (webhook) {
						body.webhook = webhook;
					}

					const list = self.getNodeParameter('list', i, '') as string;
					if (list) {
						body.list = list;
					}

					const skipIfExists = self.getNodeParameter(
						'skip_if_exists',
						i,
						false,
					) as boolean;
					if (skipIfExists) {
						body.skip_if_exists = skipIfExists;
					}

					const responseData = await self.helpers.requestWithAuthentication.call(
						self,
						'dataMergeApi',
						{
							method: 'POST',
							url: 'https://api.datamerge.ai/v1/company/enrich',
							body,
							json: true,
						},
					);

					returnData.push({ json: responseData as IDataObject });
				} else if (operation === 'getCompanyEnrichmentResult') {
					const jobId = self.getNodeParameter('job_id', i) as string;

					const responseData = await self.helpers.requestWithAuthentication.call(
						self,
						'dataMergeApi',
						{
							method: 'GET',
							url: `https://api.datamerge.ai/v1/company/enrich/${jobId}/status`,
							json: true,
						},
					);

					const data = responseData as IDataObject;

					const results =
						(data.results as IDataObject[]) ||
						(((data.result as IDataObject) || {}).results as IDataObject[]) ||
						[];

					const output: IDataObject = {
						job_id: jobId,
					};

					for (const key of Object.keys(data)) {
						if (key !== 'results' && key !== 'result') {
							output[key] = data[key];
						}
					}

					if (data.result && typeof data.result === 'object') {
						const requestData: IDataObject = { ...(data.result as IDataObject) };
						if (requestData.results) {
							delete requestData.results;
						}
						output.Request = requestData;
					}

					output.Results = results;

					returnData.push({ json: output });
				} else if (operation === 'getCompany') {
					const getCompanyBy = self.getNodeParameter(
						'get_company_by',
						i,
					) as string;
					const qs: IDataObject = {};
					if (getCompanyBy === 'datamerge_id') {
						qs.datamerge_id = self.getNodeParameter(
							'datamerge_id',
							i,
						) as string;
						const addToList = self.getNodeParameter(
							'add_to_list',
							i,
							'',
						) as string;
						if (addToList) {
							qs.add_to_list = addToList;
						}
					} else {
						qs.record_id = self.getNodeParameter('record_id', i) as string;
					}

					const responseData = await self.helpers.requestWithAuthentication.call(
						self,
						'dataMergeApi',
						{
							method: 'GET',
							url: 'https://api.datamerge.ai/v1/company/get',
							qs,
							json: true,
						},
					);

					const data = responseData as IDataObject;

					if (!data.success || !data.record) {
						// No company found, return empty list for this item
						continue;
					}

					const flattened = flattenObject(data.record as IDataObject);

					const output: IDataObject = {
						id: data.id,
						company_id: data.company_id,
						success: data.success,
						...flattened,
					};

					returnData.push({ json: output });
				} else if (operation === 'getCompanyHierarchy') {
					const datamergeId = self.getNodeParameter(
						'hierarchy_datamerge_id',
						i,
					) as string;

					const params: IDataObject = {
						datamerge_id: datamergeId,
					};

					const countryCodes = self.getNodeParameter(
						'hierarchy_country_code',
						i,
						[],
					) as string[];
					if (countryCodes && countryCodes.length > 0) {
						params.country_code = countryCodes;
					}

					const includeBranches = self.getNodeParameter(
						'include_branches',
						i,
						false,
					) as boolean;
					if (includeBranches !== undefined) {
						params.include_branches = includeBranches;
					}

					const includeNames = self.getNodeParameter(
						'include_names',
						i,
						false,
					) as boolean;
					if (includeNames !== undefined) {
						params.include_names = includeNames;
					}

					const onlySubsidiaries = self.getNodeParameter(
						'only_subsidiaries',
						i,
						false,
					) as boolean;
					if (onlySubsidiaries !== undefined) {
						params.only_subsidiaries = onlySubsidiaries;
					}

					const maxLevel = self.getNodeParameter('max_level', i, 0) as number;
					if (maxLevel > 0) {
						params.max_level = maxLevel;
					}

					const page = self.getNodeParameter('page', i, 1) as number;
					if (page) {
						params.page = page;
					}

					const responseData = await self.helpers.requestWithAuthentication.call(
						self,
						'dataMergeApi',
						{
							method: 'GET',
							url: 'https://api.datamerge.ai/v1/company/hierarchy',
							qs: params,
							json: true,
						},
					);

					const data = responseData as IDataObject;

					if (Array.isArray(data.results)) {
						data.results = (data.results as IDataObject[]).map((result) => {
							const { hierarchy_id, ...rest } = result;
							return rest;
						});
					}

					returnData.push({ json: data });
				} else if (operation === 'startContactSearch') {
					const domainsStr = self.getNodeParameter(
						'contact_search_domains',
						i,
					) as string;
					const domains = domainsStr
						.split(',')
						.map((d) => d.trim())
						.filter(Boolean);
					if (!domains.length) {
						throw new NodeOperationError(
							self.getNode(),
							'At least one domain is required for contact search',
							{ itemIndex: i },
						);
					}
					const maxResults = self.getNodeParameter(
						'max_results_per_company',
						i,
						5,
					) as number;
					const enrichFields = self.getNodeParameter(
						'enrich_fields',
						i,
					) as string[];
					const body: IDataObject = {
						domains,
						max_results_per_company: maxResults,
						enrich_fields: enrichFields,
					};
					const jobTitlesInclude = self.getNodeParameter(
						'job_titles_include',
						i,
						'',
					) as string;
					const jobTitlesExclude = self.getNodeParameter(
						'job_titles_exclude',
						i,
						'',
					) as string;
					if (jobTitlesInclude || jobTitlesExclude) {
						body.job_titles = {
							include: jobTitlesInclude
								? (JSON.parse(jobTitlesInclude) as IDataObject)
								: {},
							exclude: jobTitlesExclude
								? (JSON.parse(jobTitlesExclude) as string[])
								: [],
						};
					}
					const locationInclude = self.getNodeParameter(
						'location_include',
						i,
						'',
					) as string;
					if (locationInclude) {
						try {
							body.location = {
								include: JSON.parse(locationInclude) as IDataObject[],
								exclude: [],
							};
						} catch {
							// ignore invalid JSON
						}
					}
					const webhook = self.getNodeParameter(
						'contact_search_webhook',
						i,
						'',
					) as string;
					if (webhook) body.webhook = webhook;

					const responseData = await self.helpers.requestWithAuthentication.call(
						self,
						'dataMergeApi',
						{
							method: 'POST',
							url: 'https://api.datamerge.ai/v1/contact/search',
							body,
							json: true,
						},
					);
					returnData.push({ json: responseData as IDataObject });
				} else if (operation === 'getContactSearchStatus') {
					const jobId = self.getNodeParameter(
						'contact_search_job_id',
						i,
					) as string;
					const responseData = await self.helpers.requestWithAuthentication.call(
						self,
						'dataMergeApi',
						{
							method: 'GET',
							url: `https://api.datamerge.ai/v1/contact/search/${jobId}/status`,
							json: true,
						},
					);
					returnData.push({ json: responseData as IDataObject });
				} else if (operation === 'getContact') {
					const recordId = self.getNodeParameter(
						'contact_record_id',
						i,
					) as string;
					const responseData = await self.helpers.requestWithAuthentication.call(
						self,
						'dataMergeApi',
						{
							method: 'GET',
							url: 'https://api.datamerge.ai/v1/contact/get',
							qs: { record_id: recordId },
							json: true,
						},
					);
					const data = responseData as IDataObject;
					if (!data.success || !data.record) {
						continue;
					}
					const flattened = flattenObject(data.record as IDataObject);
					returnData.push({
						json: {
							success: data.success,
							...flattened,
						} as IDataObject,
					});
				} else if (operation === 'startLookalike') {
					const filtersStr = self.getNodeParameter(
						'companies_filters',
						i,
					) as string;
					let companiesFilters: IDataObject;
					try {
						companiesFilters = JSON.parse(filtersStr) as IDataObject;
					} catch {
						throw new NodeOperationError(
							self.getNode(),
							'Companies Filters must be valid JSON',
							{ itemIndex: i },
						);
					}
					const size = self.getNodeParameter(
						'lookalike_size',
						i,
						50,
					) as number;
					const list = self.getNodeParameter(
						'lookalike_list',
						i,
						'',
					) as string;
					const body: IDataObject = {
						companiesFilters,
						size,
					};
					if (list) body.list = list;

					const responseData = await self.helpers.requestWithAuthentication.call(
						self,
						'dataMergeApi',
						{
							method: 'POST',
							url: 'https://api.datamerge.ai/v1/company/lookalike',
							body,
							json: true,
						},
					);
					returnData.push({ json: responseData as IDataObject });
				} else if (operation === 'getLookalikeStatus') {
					const jobId = self.getNodeParameter(
						'lookalike_job_id',
						i,
					) as string;
					const responseData = await self.helpers.requestWithAuthentication.call(
						self,
						'dataMergeApi',
						{
							method: 'GET',
							url: `https://api.datamerge.ai/v1/company/lookalike/${jobId}/status`,
							json: true,
						},
					);
					returnData.push({ json: responseData as IDataObject });
				} else if (operation === 'getCreditsBalance') {
					const responseData = await self.helpers.requestWithAuthentication.call(
						self,
						'dataMergeApi',
						{
							method: 'GET',
							url: 'https://api.datamerge.ai/v1/credits/balance',
							json: true,
						},
					);
					returnData.push({ json: responseData as IDataObject });
				} else {
					throw new NodeOperationError(self.getNode(), `The operation "${operation}" is not supported.`, {
						itemIndex: i,
					});
				}
			} catch (error) {
				if (self.continueOnFail()) {
					returnData.push({
						json: {
							error: (error as Error).message,
						},
						error,
					} as unknown as INodeExecutionData);
					continue;
				}
				throw new NodeApiError(self.getNode(), error as any, {
					itemIndex: i,
				});
			}
		}

		return [returnData];
	}
}

function flattenObject(obj: IDataObject, prefix = ''): IDataObject {
	const flattened: IDataObject = {};

	for (const key of Object.keys(obj)) {
		const newKey = prefix ? `${prefix}__${key}` : key;
		const value = obj[key];

		if (value === null || value === undefined) {
			flattened[newKey] = value;
		} else if (Array.isArray(value)) {
			flattened[newKey] = value;
		} else if (typeof value === 'object') {
			Object.assign(flattened, flattenObject(value as IDataObject, newKey));
		} else {
			flattened[newKey] = value;
		}
	}

	return flattened;
}


