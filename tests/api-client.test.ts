import { BlockscoutApiClient, Block, Transaction } from '../src/api-client';
import axios from 'axios';
import { AxiosInstance } from 'axios';

const mockAxiosInstance = {
    get: jest.fn(),
} as any;

jest.mock('axios', () => ({
    __esModule: true,
    default: {
        create: jest.fn(() => mockAxiosInstance),
        isAxiosError: jest.fn((error: any) => error?.isAxiosError === true),
    },
}));

describe('BlockscoutApiClient', () => {
    let client: BlockscoutApiClient;

    beforeEach(() => {
        jest.clearAllMocks();
        client = new BlockscoutApiClient('https://test-api.com/api');
    });

    describe('getLatestBlocks', () => {
        it('should fetch latest blocks successfully and transform API response', async () => {
            const mockApiResponse = {
                items: [
                    {
                        hash: '0x123',
                        height: 100,
                        timestamp: '2024-01-01T00:00:00.000000Z',
                        transactions_count: 10,
                    },
                    {
                        hash: '0x456',
                        height: 101,
                        timestamp: '2024-01-01T00:00:10.000000Z',
                        transactions_count: 5,
                    },
                ],
            };

            mockAxiosInstance.get.mockResolvedValueOnce({
                data: mockApiResponse,
            });

            const result = await client.getLatestBlocks(2);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                hash: '0x123',
                number: 100,
                timestamp: '1704067200',
                transaction_count: 10,
            });
            expect(result[1]).toEqual({
                hash: '0x456',
                number: 101,
                timestamp: '1704067210',
                transaction_count: 5,
            });
            expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v2/blocks', {
                params: { page: 1, offset: 2 },
            });
        });

        it('should handle empty items array', async () => {
            mockAxiosInstance.get.mockResolvedValueOnce({
                data: {
                    items: [],
                },
            });

            const result = await client.getLatestBlocks(10);

            expect(result).toEqual([]);
        });

        it('should handle missing items in response', async () => {
            mockAxiosInstance.get.mockResolvedValueOnce({
                data: {},
            });

            await expect(client.getLatestBlocks(10)).rejects.toThrow('API error: Invalid response format');
        });

        it('should handle API errors with error response data', async () => {
            mockAxiosInstance.get.mockResolvedValueOnce({
                data: {
                    error: 'Invalid request',
                },
            });

            await expect(client.getLatestBlocks(10)).rejects.toThrow(/API error/);
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
        it('should fetch a specific block successfully and transform API response', async () => {
            const mockApiResponse = {
                hash: '0x123',
                height: 100,
                timestamp: '2024-01-01T00:00:00.000000Z',
                transactions_count: 10,
            };

            mockAxiosInstance.get.mockResolvedValueOnce({
                data: mockApiResponse,
            });

            const result = await client.getBlock(100);

            expect(result).toEqual({
                hash: '0x123',
                number: 100,
                timestamp: '1704067200',
                transaction_count: 10,
            });
            expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v2/blocks/100');
        });

        it('should handle missing data in response', async () => {
            mockAxiosInstance.get.mockResolvedValueOnce({
                data: null,
            });

            await expect(client.getBlock(100)).rejects.toThrow('API error: Invalid response format');
        });
    });

    describe('getTransactions', () => {
        it('should fetch transactions successfully and transform API response', async () => {
            const mockApiResponse = {
                items: [
                    {
                        hash: '0xtx1',
                        from: { hash: '0xfrom1' },
                        to: { hash: '0xto1' },
                        value: '1000000000000000000',
                        gas_price: '20000000000',
                        gas_used: '21000',
                        gas: '21000',
                        timestamp: '2024-01-01T00:00:00.000000Z',
                    },
                ],
            };

            mockAxiosInstance.get.mockResolvedValueOnce({
                data: mockApiResponse,
            });

            const result = await client.getTransactions({ block_number: 100, offset: 50 });

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                hash: '0xtx1',
                from: '0xfrom1',
                to: '0xto1',
                value: '1000000000000000000',
                gas_price: '20000000000',
                gas_used: '21000',
                gas: '21000',
                timestamp: '1704067200',
            });
            expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v2/transactions', {
                params: {
                    page: 1,
                    offset: 50,
                    block_number: 100,
                },
            });
        });

        it('should handle contract deployment transactions (null to)', async () => {
            const mockApiResponse = {
                items: [
                    {
                        hash: '0xtx1',
                        from: { hash: '0xfrom1' },
                        to: null,
                        value: '0',
                        gas_price: '20000000000',
                        gas_used: '21000',
                        gas: '21000',
                        timestamp: '2024-01-01T00:00:00.000000Z',
                    },
                ],
            };

            mockAxiosInstance.get.mockResolvedValueOnce({
                data: mockApiResponse,
            });

            const result = await client.getTransactions({ block_number: 100 });

            expect(result[0].to).toBeNull();
        });

        it('should handle missing from/to hash fields', async () => {
            const mockApiResponse = {
                items: [
                    {
                        hash: '0xtx1',
                        from: null,
                        to: { hash: '0xto1' },
                        value: '0',
                        gas_price: '20000000000',
                        gas_used: '21000',
                        gas: '21000',
                        timestamp: '2024-01-01T00:00:00.000000Z',
                    },
                ],
            };

            mockAxiosInstance.get.mockResolvedValueOnce({
                data: mockApiResponse,
            });

            const result = await client.getTransactions({ block_number: 100 });

            expect(result[0].from).toBe('');
        });

        it('should handle empty items array', async () => {
            mockAxiosInstance.get.mockResolvedValueOnce({
                data: {
                    items: [],
                },
            });

            const result = await client.getTransactions({ block_number: 100 });

            expect(result).toEqual([]);
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

