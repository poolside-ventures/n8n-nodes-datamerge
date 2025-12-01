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
		version: 1,
		description: 'Interact with the DataMerge API',
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
				name: 'webhook_url',
				type: 'string',
				default: '',
				placeholder: 'https://your-app.com/webhook',
				description:
					'URL to send the results to when processing is complete. If not provided, results will be available via polling (for testing).',
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
				displayName: 'Company ID',
				name: 'company_id',
				type: 'string',
				default: '',
				placeholder: 'DM001283124635',
				description:
					'The DataMerge company ID. You can map this from a previous node.',
				displayOptions: {
					show: {
						operation: ['getCompany'],
					},
				},
				required: true,
			},

			// Get Company Hierarchy
			{
				displayName: 'Company ID',
				name: 'hierarchy_company_id',
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

					const webhookUrl = self.getNodeParameter(
						'webhook_url',
						i,
						'',
					) as string;
					if (webhookUrl) {
						body.webhook_url = webhookUrl;
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
							url: `https://api.datamerge.ai/v1/job/${jobId}/status`,
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
					const companyId = self.getNodeParameter('company_id', i) as string;

					const responseData = await self.helpers.requestWithAuthentication.call(
						self,
						'dataMergeApi',
						{
							method: 'GET',
							url: 'https://api.datamerge.ai/v1/company/get',
							qs: {
								company_id: companyId,
							},
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
					const companyId = self.getNodeParameter(
						'hierarchy_company_id',
						i,
					) as string;

					const params: IDataObject = {
						company_id: companyId,
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


