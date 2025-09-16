import { BlockscoutApiClient } from './api-client';
import {
    computeTransactionVolume,
    computeAverageGasPrice,
    computeActiveAddresses,
    computeContractDeployments,
    computeBlockTimeStats,
    computeTopAddresses,
    computeTransactionValueStats,
} from './statistics';
import { Block, Transaction } from './api-client';

async function main() {
    const blockRange = parseInt(process.env.BLOCK_RANGE || '100', 10);
    const apiClient = new BlockscoutApiClient();

    console.log('='.repeat(60));
    console.log('MegaETH Testnet Statistics');
    console.log('='.repeat(60));
    console.log(`Analyzing last ${blockRange} blocks...\n`);

    try {
        let blocks: Block[];
        let transactions: Transaction[] = [];

        try {
            blocks = await apiClient.retryWithBackoff(() => apiClient.getLatestBlocks(blockRange));
            console.log(`✓ Fetched ${blocks.length} blocks\n`);

            if (blocks.length === 0) {
                console.log('No blocks found. Exiting.');
                process.exit(0);
            }

            for (const block of blocks.slice(0, Math.min(20, blocks.length))) {
                try {
                    const blockTxs = await apiClient.retryWithBackoff(() =>
                        apiClient.getTransactions({ block_number: block.number, offset: 100 })
                    );
                    transactions.push(...blockTxs);
                } catch (error) {
                    console.warn(`Warning: Could not fetch transactions for block ${block.number}`);
                }
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`\n✗ Error fetching data: ${errorMessage}`);
            process.exit(1);
        }

        if (transactions.length === 0 && blocks.length > 0) {
            console.log('No transactions found in analyzed blocks.\n');
        }

        console.log(`✓ Collected ${transactions.length} transactions\n`);

        const transactionVolume = computeTransactionVolume(blocks);
        const gasPriceStats = computeAverageGasPrice(transactions);
        const activeAddresses = computeActiveAddresses(transactions);
        const contractDeployments = computeContractDeployments(transactions);
        const blockTimeStats = computeBlockTimeStats(blocks);
        const topAddresses = computeTopAddresses(transactions, 5);
        const valueStats = computeTransactionValueStats(transactions);

        console.log('\n' + '='.repeat(60));
        console.log('BLOCK STATISTICS');
        console.log('='.repeat(60));
        console.log(`Blocks Analyzed:        ${transactionVolume.blocksAnalyzed}`);
        console.log(`Total Transactions:     ${transactionVolume.totalTransactions}`);
        console.log(`Avg Transactions/Block: ${transactionVolume.averageTransactionsPerBlock.toFixed(2)}`);

        if (blockTimeStats.totalBlocks >= 2) {
            console.log(`\nAverage Block Time:     ${blockTimeStats.averageBlockTimeSeconds.toFixed(2)} seconds`);
            console.log(`Min Block Time:         ${blockTimeStats.minBlockTimeSeconds.toFixed(2)} seconds`);
            console.log(`Max Block Time:         ${blockTimeStats.maxBlockTimeSeconds.toFixed(2)} seconds`);
        }

        if (transactions.length > 0) {
            console.log('\n' + '='.repeat(60));
            console.log('GAS PRICE STATISTICS');
            console.log('='.repeat(60));
            console.log(`Average Gas Price:      ${gasPriceStats.averageGasPriceGwei.toFixed(4)} gwei`);
            console.log(`Min Gas Price:          ${gasPriceStats.minGasPriceGwei.toFixed(4)} gwei`);
            console.log(`Max Gas Price:          ${gasPriceStats.maxGasPriceGwei.toFixed(4)} gwei`);

            console.log('\n' + '='.repeat(60));
            console.log('ADDRESS STATISTICS');
            console.log('='.repeat(60));
            console.log(`Unique Addresses:       ${activeAddresses.uniqueAddresses}`);
            console.log(`Unique Senders:         ${activeAddresses.uniqueSenders}`);
            console.log(`Unique Receivers:       ${activeAddresses.uniqueReceivers}`);

            console.log('\n' + '='.repeat(60));
            console.log('CONTRACT DEPLOYMENTS');
            console.log('='.repeat(60));
            console.log(`Total Deployments:      ${contractDeployments.totalDeployments}`);
            console.log(`Deployment Percentage:  ${contractDeployments.deploymentPercentage.toFixed(2)}%`);

            console.log('\n' + '='.repeat(60));
            console.log('TOP 5 MOST ACTIVE ADDRESSES');
            console.log('='.repeat(60));
            if (topAddresses.length > 0) {
                topAddresses.forEach((addr, index) => {
                    console.log(`${index + 1}. ${addr.address}`);
                    console.log(`   Transactions: ${addr.transactionCount}`);
                });
            } else {
                console.log('No addresses found');
            }

            if (valueStats.totalTransactions > 0) {
                console.log('\n' + '='.repeat(60));
                console.log('TRANSACTION VALUE STATISTICS');
                console.log('='.repeat(60));
                console.log(`Total Value:            ${valueStats.totalValueEth.toFixed(6)} ETH`);
                console.log(`Average Value:          ${valueStats.averageValueEth.toFixed(6)} ETH`);
                console.log(`Min Value:              ${valueStats.minValueEth.toFixed(6)} ETH`);
                console.log(`Max Value:              ${valueStats.maxValueEth.toFixed(6)} ETH`);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('Statistics computation complete!');
        console.log('='.repeat(60));
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`\n✗ Unexpected error: ${errorMessage}`);
        process.exit(1);
    }
}

main();

