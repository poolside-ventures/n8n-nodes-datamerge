import type {
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class DataMergeApi implements ICredentialType {
	name = 'dataMergeApi';

	displayName = 'DataMerge API';

	documentationUrl = '';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description:
				'Your DataMerge API key. You can find this in your DataMerge account settings.',
		},
	];

	authenticate = {
		type: 'generic' as const,
		properties: {
			headers: {
				Authorization: '={{"Token " + $credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			method: 'GET',
			url: 'https://api.datamerge.ai/auth/info',
		},
	};
}


