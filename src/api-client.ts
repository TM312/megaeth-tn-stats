import axios, { AxiosInstance } from 'axios';

export interface Block {
    hash: string;
    number: number;
    timestamp: string;
    transaction_count: number;
    transactions?: Transaction[];
}

export interface Transaction {
    hash: string;
    from: string;
    to: string | null;
    value: string;
    gas_price: string;
    gas_used: string;
    gas: string;
    timestamp: string;
}

interface ApiBlock {
    hash: string;
    height: number;
    timestamp: string;
    transactions_count: number;
    [key: string]: any;
}

interface ApiTransaction {
    hash: string;
    from: { hash: string };
    to: { hash: string } | null;
    value: string;
    gas_price: string;
    gas_used: string;
    gas: string;
    timestamp: string;
    [key: string]: any;
}

interface BlockscoutBlocksResponse {
    items: ApiBlock[];
    next_page_params?: any;
}

interface BlockscoutTransactionsResponse {
    items: ApiTransaction[];
    next_page_params?: any;
}

function isoToUnixTimestamp(isoString: string): string {
    return Math.floor(new Date(isoString).getTime() / 1000).toString();
}

export class BlockscoutApiClient {
    private client: AxiosInstance;
    private baseUrl: string;

    constructor(baseUrl: string = 'https://megaeth-testnet.blockscout.com/api') {
        this.baseUrl = baseUrl;
        this.client = axios.create({
            baseURL: baseUrl,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    async getLatestBlocks(limit: number = 100): Promise<Block[]> {
        try {
            const response = await this.client.get<BlockscoutBlocksResponse>('/v2/blocks', {
                params: {
                    page: 1,
                    offset: limit,
                },
            });

            if (response.data?.items) {
                return response.data.items.map((apiBlock: ApiBlock) => ({
                    hash: apiBlock.hash,
                    number: apiBlock.height,
                    timestamp: isoToUnixTimestamp(apiBlock.timestamp),
                    transaction_count: apiBlock.transactions_count,
                }));
            }

            throw new Error('API error: Invalid response format');
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 429) {
                    throw new Error('Rate limit exceeded. Please try again later.');
                }
                if (error.response?.data) {
                    throw new Error(`API error: ${JSON.stringify(error.response.data)}`);
                }
                throw new Error(`Network error: ${error.message}`);
            }
            throw error;
        }
    }

    async getBlock(blockNumber: number): Promise<Block> {
        try {
            const response = await this.client.get<ApiBlock>(`/v2/blocks/${blockNumber}`);

            if (response.data) {
                return {
                    hash: response.data.hash,
                    number: response.data.height,
                    timestamp: isoToUnixTimestamp(response.data.timestamp),
                    transaction_count: response.data.transactions_count,
                };
            }

            throw new Error('API error: Invalid response format');
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 429) {
                    throw new Error('Rate limit exceeded. Please try again later.');
                }
                if (error.response?.data) {
                    throw new Error(`API error: ${JSON.stringify(error.response.data)}`);
                }
                throw new Error(`Network error: ${error.message}`);
            }
            throw error;
        }
    }

    async getTransactions(params: {
        block_number?: number;
        address?: string;
        page?: number;
        offset?: number;
    }): Promise<Transaction[]> {
        try {
            const response = await this.client.get<BlockscoutTransactionsResponse>('/v2/transactions', {
                params: {
                    page: params.page || 1,
                    offset: params.offset || 100,
                    ...(params.block_number && { block_number: params.block_number }),
                    ...(params.address && { address: params.address }),
                },
            });

            if (response.data?.items) {
                return response.data.items.map((apiTx: ApiTransaction) => ({
                    hash: apiTx.hash,
                    from: apiTx.from?.hash || '',
                    to: apiTx.to?.hash || null,
                    value: apiTx.value || '0',
                    gas_price: apiTx.gas_price || '0',
                    gas_used: apiTx.gas_used || '0',
                    gas: apiTx.gas || '0',
                    timestamp: isoToUnixTimestamp(apiTx.timestamp),
                }));
            }

            throw new Error('API error: Invalid response format');
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 429) {
                    throw new Error('Rate limit exceeded. Please try again later.');
                }
                if (error.response?.data) {
                    throw new Error(`API error: ${JSON.stringify(error.response.data)}`);
                }
                throw new Error(`Network error: ${error.message}`);
            }
            throw error;
        }
    }

    async getAddress(address: string): Promise<any> {
        try {
            const response = await this.client.get<any>(`/v2/addresses/${address}`);

            if (response.data) {
                return response.data;
            }

            throw new Error('API error: Invalid response format');
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 429) {
                    throw new Error('Rate limit exceeded. Please try again later.');
                }
                if (error.response?.data) {
                    throw new Error(`API error: ${JSON.stringify(error.response.data)}`);
                }
                throw new Error(`Network error: ${error.message}`);
            }
            throw error;
        }
    }

    async retryWithBackoff<T>(
        fn: () => Promise<T>,
        maxRetries: number = 3,
        initialDelay: number = 1000
    ): Promise<T> {
        let lastError: Error | undefined;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));

                if (attempt < maxRetries - 1) {
                    const delay = initialDelay * Math.pow(2, attempt);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        throw lastError || new Error('Unknown error occurred');
    }
}

