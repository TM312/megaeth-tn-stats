import {
    computeTransactionVolume,
    computeAverageGasPrice,
    computeActiveAddresses,
    computeContractDeployments,
    computeBlockTimeStats,
    computeTopAddresses,
    computeTransactionValueStats,
} from '../src/statistics';
import { Block, Transaction } from '../src/api-client';

describe('Statistics Functions', () => {
    describe('computeTransactionVolume', () => {
        it('should calculate transaction volume correctly', () => {
            const blocks: Block[] = [
                { hash: '0x1', number: 100, timestamp: '1000', transaction_count: 10 },
                { hash: '0x2', number: 101, timestamp: '1010', transaction_count: 5 },
                { hash: '0x3', number: 102, timestamp: '1020', transaction_count: 15 },
            ];

            const result = computeTransactionVolume(blocks);

            expect(result.totalTransactions).toBe(30);
            expect(result.blocksAnalyzed).toBe(3);
            expect(result.averageTransactionsPerBlock).toBe(10);
        });

        it('should handle empty blocks array', () => {
            const result = computeTransactionVolume([]);

            expect(result.totalTransactions).toBe(0);
            expect(result.blocksAnalyzed).toBe(0);
            expect(result.averageTransactionsPerBlock).toBe(0);
        });
    });

    describe('computeAverageGasPrice', () => {
        it('should calculate gas price statistics correctly', () => {
            const transactions: Transaction[] = [
                {
                    hash: '0x1',
                    from: '0xa',
                    to: '0xb',
                    value: '0',
                    gas_price: '1000000000',
                    gas_used: '21000',
                    gas: '21000',
                    timestamp: '1000',
                },
                {
                    hash: '0x2',
                    from: '0xa',
                    to: '0xb',
                    value: '0',
                    gas_price: '2000000000',
                    gas_used: '21000',
                    gas: '21000',
                    timestamp: '1000',
                },
                {
                    hash: '0x3',
                    from: '0xa',
                    to: '0xb',
                    value: '0',
                    gas_price: '3000000000',
                    gas_used: '21000',
                    gas: '21000',
                    timestamp: '1000',
                },
            ];

            const result = computeAverageGasPrice(transactions);

            expect(result.averageGasPriceGwei).toBeCloseTo(2.0, 4);
            expect(result.minGasPriceGwei).toBeCloseTo(1.0, 4);
            expect(result.maxGasPriceGwei).toBeCloseTo(3.0, 4);
            expect(result.totalTransactions).toBe(3);
        });

        it('should handle empty transactions array', () => {
            const result = computeAverageGasPrice([]);

            expect(result.averageGasPriceGwei).toBe(0);
            expect(result.minGasPriceGwei).toBe(0);
            expect(result.maxGasPriceGwei).toBe(0);
            expect(result.totalTransactions).toBe(0);
        });

        it('should handle transactions with zero gas price', () => {
            const transactions: Transaction[] = [
                {
                    hash: '0x1',
                    from: '0xa',
                    to: '0xb',
                    value: '0',
                    gas_price: '0',
                    gas_used: '21000',
                    gas: '21000',
                    timestamp: '1000',
                },
            ];

            const result = computeAverageGasPrice(transactions);

            expect(result.averageGasPriceGwei).toBe(0);
            expect(result.totalTransactions).toBe(1);
        });
    });

    describe('computeActiveAddresses', () => {
        it('should count unique addresses correctly', () => {
            const transactions: Transaction[] = [
                { hash: '0x1', from: '0xA', to: '0xB', value: '0', gas_price: '1000', gas_used: '21000', gas: '21000', timestamp: '1000' },
                { hash: '0x2', from: '0xA', to: '0xC', value: '0', gas_price: '1000', gas_used: '21000', gas: '21000', timestamp: '1000' },
                { hash: '0x3', from: '0xB', to: '0xC', value: '0', gas_price: '1000', gas_used: '21000', gas: '21000', timestamp: '1000' },
            ];

            const result = computeActiveAddresses(transactions);

            expect(result.uniqueAddresses).toBe(3);
            expect(result.uniqueSenders).toBe(2);
            expect(result.uniqueReceivers).toBe(2);
        });

        it('should handle empty transactions array', () => {
            const result = computeActiveAddresses([]);

            expect(result.uniqueAddresses).toBe(0);
            expect(result.uniqueSenders).toBe(0);
            expect(result.uniqueReceivers).toBe(0);
        });
    });

    describe('computeContractDeployments', () => {
        it('should count contract deployments correctly', () => {
            const transactions: Transaction[] = [
                { hash: '0x1', from: '0xA', to: null, value: '0', gas_price: '1000', gas_used: '21000', gas: '21000', timestamp: '1000' },
                { hash: '0x2', from: '0xA', to: '0xB', value: '0', gas_price: '1000', gas_used: '21000', gas: '21000', timestamp: '1000' },
                { hash: '0x3', from: '0xB', to: '', value: '0', gas_price: '1000', gas_used: '21000', gas: '21000', timestamp: '1000' },
            ];

            const result = computeContractDeployments(transactions);

            expect(result.totalDeployments).toBe(2);
            expect(result.deploymentPercentage).toBeCloseTo(66.67, 1);
        });

        it('should handle empty transactions array', () => {
            const result = computeContractDeployments([]);

            expect(result.totalDeployments).toBe(0);
            expect(result.deploymentPercentage).toBe(0);
        });
    });

    describe('computeBlockTimeStats', () => {
        it('should calculate block time statistics correctly', () => {
            const blocks: Block[] = [
                { hash: '0x1', number: 100, timestamp: '1000', transaction_count: 10 },
                { hash: '0x2', number: 101, timestamp: '1010', transaction_count: 5 },
                { hash: '0x3', number: 102, timestamp: '1025', transaction_count: 15 },
                { hash: '0x4', number: 103, timestamp: '1040', transaction_count: 8 },
            ];

            const result = computeBlockTimeStats(blocks);

            expect(result.averageBlockTimeSeconds).toBeCloseTo(13.33, 1);
            expect(result.minBlockTimeSeconds).toBe(10);
            expect(result.maxBlockTimeSeconds).toBe(15);
            expect(result.totalBlocks).toBe(4);
        });

        it('should handle single block', () => {
            const blocks: Block[] = [
                { hash: '0x1', number: 100, timestamp: '1000', transaction_count: 10 },
            ];

            const result = computeBlockTimeStats(blocks);

            expect(result.averageBlockTimeSeconds).toBe(0);
            expect(result.totalBlocks).toBe(1);
        });

        it('should handle empty blocks array', () => {
            const result = computeBlockTimeStats([]);

            expect(result.averageBlockTimeSeconds).toBe(0);
            expect(result.totalBlocks).toBe(0);
        });
    });

    describe('computeTopAddresses', () => {
        it('should return top addresses correctly', () => {
            const transactions: Transaction[] = [
                { hash: '0x1', from: '0xA', to: '0xB', value: '0', gas_price: '1000', gas_used: '21000', gas: '21000', timestamp: '1000' },
                { hash: '0x2', from: '0xA', to: '0xC', value: '0', gas_price: '1000', gas_used: '21000', gas: '21000', timestamp: '1000' },
                { hash: '0x3', from: '0xA', to: '0xB', value: '0', gas_price: '1000', gas_used: '21000', gas: '21000', timestamp: '1000' },
                { hash: '0x4', from: '0xB', to: '0xC', value: '0', gas_price: '1000', gas_used: '21000', gas: '21000', timestamp: '1000' },
            ];

            const result = computeTopAddresses(transactions, 3);

            expect(result.length).toBe(3);
            expect(result[0].address).toBe('0xa');
            expect(result[0].transactionCount).toBe(3);
            expect(result[1].address).toBe('0xb');
            expect(result[1].transactionCount).toBe(3);
            expect(result[2].address).toBe('0xc');
            expect(result[2].transactionCount).toBe(2);
        });

        it('should handle empty transactions array', () => {
            const result = computeTopAddresses([]);

            expect(result.length).toBe(0);
        });
    });

    describe('computeTransactionValueStats', () => {
        it('should calculate value statistics correctly', () => {
            const transactions: Transaction[] = [
                {
                    hash: '0x1',
                    from: '0xA',
                    to: '0xB',
                    value: '1000000000000000000',
                    gas_price: '1000',
                    gas_used: '21000',
                    gas: '21000',
                    timestamp: '1000',
                },
                {
                    hash: '0x2',
                    from: '0xA',
                    to: '0xB',
                    value: '2000000000000000000',
                    gas_price: '1000',
                    gas_used: '21000',
                    gas: '21000',
                    timestamp: '1000',
                },
                {
                    hash: '0x3',
                    from: '0xA',
                    to: '0xB',
                    value: '3000000000000000000',
                    gas_price: '1000',
                    gas_used: '21000',
                    gas: '21000',
                    timestamp: '1000',
                },
            ];

            const result = computeTransactionValueStats(transactions);

            expect(result.totalValueEth).toBeCloseTo(6.0, 6);
            expect(result.averageValueEth).toBeCloseTo(2.0, 6);
            expect(result.minValueEth).toBeCloseTo(1.0, 6);
            expect(result.maxValueEth).toBeCloseTo(3.0, 6);
            expect(result.totalTransactions).toBe(3);
        });

        it('should handle empty transactions array', () => {
            const result = computeTransactionValueStats([]);

            expect(result.totalValueEth).toBe(0);
            expect(result.averageValueEth).toBe(0);
            expect(result.totalTransactions).toBe(0);
        });

        it('should handle transactions with zero value', () => {
            const transactions: Transaction[] = [
                {
                    hash: '0x1',
                    from: '0xA',
                    to: '0xB',
                    value: '0',
                    gas_price: '1000',
                    gas_used: '21000',
                    gas: '21000',
                    timestamp: '1000',
                },
            ];

            const result = computeTransactionValueStats(transactions);

            expect(result.totalValueEth).toBe(0);
            expect(result.totalTransactions).toBe(1);
        });
    });
});

