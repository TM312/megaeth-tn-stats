import { BlockscoutApiClient, Block, Transaction } from '../src/api-client';
import axios from 'axios';
import { AxiosInstance } from 'axios';

const mockAxiosInstance = {
    get: jest.fn(),
} as any;

jest.mock('axios', () => ({
    default: {
        create: jest.fn(() => mockAxiosInstance),
    },
}));

describe('BlockscoutApiClient', () => {
    let client: BlockscoutApiClient;

    beforeEach(() => {
        jest.clearAllMocks();
        client = new BlockscoutApiClient('https://test-api.com/api');
    });

    describe('getLatestBlocks', () => {
        it('should fetch latest blocks successfully', async () => {
            const mockBlocks: Block[] = [
                {
                    hash: '0x123',
                    number: 100,
                    timestamp: '1000000',
                    transaction_count: 10,
                },
                {
                    hash: '0x456',
                    number: 101,
                    timestamp: '1000010',
                    transaction_count: 5,
                },
            ];

            mockAxiosInstance.get.mockResolvedValueOnce({
                data: {
                    status: '1',
                    message: 'OK',
                    result: {
                        items: mockBlocks,
                        next_page_path: null,
                    },
                },
            });

            const result = await client.getLatestBlocks(2);

            expect(result).toEqual(mockBlocks);
            expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v2/blocks', {
                params: { page: 1, offset: 2 },
            });
        });

        it('should handle API errors', async () => {
            mockAxiosInstance.get.mockResolvedValueOnce({
                data: {
                    status: '0',
                    message: 'Error occurred',
                    result: null,
                },
            });

            await expect(client.getLatestBlocks(10)).rejects.toThrow('API error: Error occurred');
        });

        it('should handle rate limit errors', async () => {
            mockAxiosInstance.get.mockRejectedValueOnce({
                response: { status: 429 },
                isAxiosError: true,
                message: 'Rate limit exceeded',
            });

            await expect(client.getLatestBlocks(10)).rejects.toThrow('Rate limit exceeded. Please try again later.');
        });

        it('should handle network errors', async () => {
            mockAxiosInstance.get.mockRejectedValueOnce({
                isAxiosError: true,
                message: 'Network error',
            });

            await expect(client.getLatestBlocks(10)).rejects.toThrow('Network error: Network error');
        });
    });

    describe('getBlock', () => {
        it('should fetch a specific block successfully', async () => {
            const mockBlock: Block = {
                hash: '0x123',
                number: 100,
                timestamp: '1000000',
                transaction_count: 10,
            };

            mockAxiosInstance.get.mockResolvedValueOnce({
                data: {
                    status: '1',
                    message: 'OK',
                    result: mockBlock,
                },
            });

            const result = await client.getBlock(100);

            expect(result).toEqual(mockBlock);
            expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v2/blocks/100');
        });
    });

    describe('getTransactions', () => {
        it('should fetch transactions successfully', async () => {
            const mockTransactions: Transaction[] = [
                {
                    hash: '0xtx1',
                    from: '0xfrom1',
                    to: '0xto1',
                    value: '1000000000000000000',
                    gas_price: '20000000000',
                    gas_used: '21000',
                    gas: '21000',
                    timestamp: '1000000',
                },
            ];

            mockAxiosInstance.get.mockResolvedValueOnce({
                data: {
                    status: '1',
                    message: 'OK',
                    result: {
                        items: mockTransactions,
                    },
                },
            });

            const result = await client.getTransactions({ block_number: 100, offset: 50 });

            expect(result).toEqual(mockTransactions);
            expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v2/transactions', {
                params: {
                    page: 1,
                    offset: 50,
                    block_number: 100,
                },
            });
        });
    });

    describe('retryWithBackoff', () => {
        it('should retry on failure and succeed', async () => {
            let attempts = 0;
            const mockFn = jest.fn(async () => {
                attempts++;
                if (attempts < 2) {
                    throw new Error('Temporary error');
                }
                return 'success';
            });

            const result = await client.retryWithBackoff(mockFn, 3, 10);

            expect(result).toBe('success');
            expect(mockFn).toHaveBeenCalledTimes(2);
        });

        it('should throw after max retries', async () => {
            const mockFn = jest.fn(async () => {
                throw new Error('Persistent error');
            });

            await expect(client.retryWithBackoff(mockFn, 3, 10)).rejects.toThrow('Persistent error');
            expect(mockFn).toHaveBeenCalledTimes(3);
        });
    });
});

