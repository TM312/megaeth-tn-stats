# MegaETH Testnet Statistics

A simple Node.js/TypeScript project that connects to the MegaETH testnet Blockscout API and computes interesting blockchain statistics, printing results to the console.

## Features

- **Block Statistics**: Transaction volume, average transactions per block, block time analysis
- **Gas Price Analysis**: Average, min, and max gas prices in gwei
- **Address Activity**: Unique addresses, senders, and receivers
- **Contract Deployments**: Count and percentage of contract creation transactions
- **Top Addresses**: Most active addresses by transaction count
- **Transaction Values**: Total, average, min, and max ETH transferred

## Prerequisites

- Node.js (v18 or higher)
- npm

## Installation

1. Clone the repository and navigate to the project directory:
```bash
cd megaeth-tn-stats
```

2. Install dependencies:
```bash
npm install
```

## Usage

### Run the application

```bash
npm start
```

Or using ts-node directly:
```bash
npx ts-node src/index.ts
```

### Configure block range

By default, the application analyzes the last 100 blocks. You can change this by setting the `BLOCK_RANGE` environment variable:

```bash
BLOCK_RANGE=50 npm start
```

## Running Tests

```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Building

Compile TypeScript to JavaScript:
```bash
npm run build
```

The compiled files will be in the `dist/` directory.

## Project Structure

```
megaeth-tn-stats/
├── src/
│   ├── index.ts          # Main entry point
│   ├── api-client.ts     # Blockscout API client wrapper
│   └── statistics.ts     # Statistics computation logic
├── tests/
│   ├── api-client.test.ts
│   └── statistics.test.ts
├── package.json
├── tsconfig.json
└── README.md
```

## API Endpoint

The project uses the Blockscout API for MegaETH testnet:
- Base URL: `https://megaeth-testnet.blockscout.com/api`

## Error Handling

The application includes:
- Retry logic with exponential backoff for transient failures
- Rate limit detection and user-friendly error messages
- Network error handling

## License

MIT

