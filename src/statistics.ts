import { Block, Transaction } from './api-client';

export interface TransactionVolumeStats {
    totalTransactions: number;
    blocksAnalyzed: number;
    averageTransactionsPerBlock: number;
}

export interface GasPriceStats {
    averageGasPriceGwei: number;
    minGasPriceGwei: number;
    maxGasPriceGwei: number;
    totalTransactions: number;
}

export interface ActiveAddressesStats {
    uniqueAddresses: number;
    uniqueSenders: number;
    uniqueReceivers: number;
}

export interface ContractDeploymentStats {
    totalDeployments: number;
    deploymentPercentage: number;
}

export interface BlockTimeStats {
    averageBlockTimeSeconds: number;
    minBlockTimeSeconds: number;
    maxBlockTimeSeconds: number;
    totalBlocks: number;
}

export interface TopAddress {
    address: string;
    transactionCount: number;
}

export interface TransactionValueStats {
    totalValueEth: number;
    averageValueEth: number;
    minValueEth: number;
    maxValueEth: number;
    totalTransactions: number;
}

export function computeTransactionVolume(blocks: Block[]): TransactionVolumeStats {
    const totalTransactions = blocks.reduce((sum, block) => sum + block.transaction_count, 0);
    const blocksAnalyzed = blocks.length;
    const averageTransactionsPerBlock = blocksAnalyzed > 0 ? totalTransactions / blocksAnalyzed : 0;

    return {
        totalTransactions,
        blocksAnalyzed,
        averageTransactionsPerBlock,
    };
}

export function computeAverageGasPrice(transactions: Transaction[]): GasPriceStats {
    if (transactions.length === 0) {
        return {
            averageGasPriceGwei: 0,
            minGasPriceGwei: 0,
            maxGasPriceGwei: 0,
            totalTransactions: 0,
        };
    }

    const gasPricesWei = transactions
        .map(tx => BigInt(tx.gas_price || '0'))
        .filter(price => price > 0n);

    if (gasPricesWei.length === 0) {
        return {
            averageGasPriceGwei: 0,
            minGasPriceGwei: 0,
            maxGasPriceGwei: 0,
            totalTransactions: transactions.length,
        };
    }

    const sumGasPrice = gasPricesWei.reduce((sum, price) => sum + price, 0n);
    const averageGasPriceWei = sumGasPrice / BigInt(gasPricesWei.length);
    const minGasPriceWei = gasPricesWei.reduce((min, price) => (price < min ? price : min), gasPricesWei[0]);
    const maxGasPriceWei = gasPricesWei.reduce((max, price) => (price > max ? price : max), gasPricesWei[0]);

    const weiToGwei = (wei: bigint) => Number(wei) / 1e9;

    return {
        averageGasPriceGwei: weiToGwei(averageGasPriceWei),
        minGasPriceGwei: weiToGwei(minGasPriceWei),
        maxGasPriceGwei: weiToGwei(maxGasPriceWei),
        totalTransactions: transactions.length,
    };
}

export function computeActiveAddresses(transactions: Transaction[]): ActiveAddressesStats {
    const senders = new Set<string>();
    const receivers = new Set<string>();
    const allAddresses = new Set<string>();

    transactions.forEach(tx => {
        if (tx.from) {
            senders.add(tx.from.toLowerCase());
            allAddresses.add(tx.from.toLowerCase());
        }
        if (tx.to) {
            receivers.add(tx.to.toLowerCase());
            allAddresses.add(tx.to.toLowerCase());
        }
    });

    return {
        uniqueAddresses: allAddresses.size,
        uniqueSenders: senders.size,
        uniqueReceivers: receivers.size,
    };
}

export function computeContractDeployments(transactions: Transaction[]): ContractDeploymentStats {
    const deployments = transactions.filter(tx => tx.to === null || tx.to === '');
    const totalDeployments = deployments.length;
    const deploymentPercentage = transactions.length > 0 ? (totalDeployments / transactions.length) * 100 : 0;

    return {
        totalDeployments,
        deploymentPercentage,
    };
}

export function computeBlockTimeStats(blocks: Block[]): BlockTimeStats {
    if (blocks.length < 2) {
        return {
            averageBlockTimeSeconds: 0,
            minBlockTimeSeconds: 0,
            maxBlockTimeSeconds: 0,
            totalBlocks: blocks.length,
        };
    }

    const sortedBlocks = [...blocks].sort((a, b) => a.number - b.number);
    const blockTimes: number[] = [];

    for (let i = 1; i < sortedBlocks.length; i++) {
        const prevTimestamp = parseInt(sortedBlocks[i - 1].timestamp);
        const currTimestamp = parseInt(sortedBlocks[i].timestamp);
        const blockTime = currTimestamp - prevTimestamp;
        blockTimes.push(blockTime);
    }

    if (blockTimes.length === 0) {
        return {
            averageBlockTimeSeconds: 0,
            minBlockTimeSeconds: 0,
            maxBlockTimeSeconds: 0,
            totalBlocks: blocks.length,
        };
    }

    const sum = blockTimes.reduce((a, b) => a + b, 0);
    const average = sum / blockTimes.length;
    const min = Math.min(...blockTimes);
    const max = Math.max(...blockTimes);

    return {
        averageBlockTimeSeconds: average,
        minBlockTimeSeconds: min,
        maxBlockTimeSeconds: max,
        totalBlocks: blocks.length,
    };
}

export function computeTopAddresses(transactions: Transaction[], limit: number = 5): TopAddress[] {
    const addressCounts = new Map<string, number>();

    transactions.forEach(tx => {
        if (tx.from) {
            const addr = tx.from.toLowerCase();
            addressCounts.set(addr, (addressCounts.get(addr) || 0) + 1);
        }
        if (tx.to) {
            const addr = tx.to.toLowerCase();
            addressCounts.set(addr, (addressCounts.get(addr) || 0) + 1);
        }
    });

    const sortedAddresses = Array.from(addressCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([address, transactionCount]) => ({ address, transactionCount }));

    return sortedAddresses;
}

export function computeTransactionValueStats(transactions: Transaction[]): TransactionValueStats {
    if (transactions.length === 0) {
        return {
            totalValueEth: 0,
            averageValueEth: 0,
            minValueEth: 0,
            maxValueEth: 0,
            totalTransactions: 0,
        };
    }

    const valuesWei = transactions
        .map(tx => {
            try {
                return BigInt(tx.value || '0');
            } catch {
                return 0n;
            }
        })
        .filter(value => value > 0n);

    if (valuesWei.length === 0) {
        return {
            totalValueEth: 0,
            averageValueEth: 0,
            minValueEth: 0,
            maxValueEth: 0,
            totalTransactions: transactions.length,
        };
    }

    const sumValue = valuesWei.reduce((sum, value) => sum + value, 0n);
    const averageValueWei = sumValue / BigInt(valuesWei.length);
    const minValueWei = valuesWei.reduce((min, value) => (value < min ? value : min), valuesWei[0]);
    const maxValueWei = valuesWei.reduce((max, value) => (value > max ? value : max), valuesWei[0]);

    const weiToEth = (wei: bigint) => Number(wei) / 1e18;

    return {
        totalValueEth: weiToEth(sumValue),
        averageValueEth: weiToEth(averageValueWei),
        minValueEth: weiToEth(minValueWei),
        maxValueEth: weiToEth(maxValueWei),
        totalTransactions: transactions.length,
    };
}

