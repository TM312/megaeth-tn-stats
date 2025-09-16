.PHONY: install build start test test-watch clean help

# Default target
.DEFAULT_GOAL := help

# Variables
BLOCK_RANGE ?= 100

# Install dependencies
install:
	npm install

# Build TypeScript to JavaScript
build:
	npm run build

# Run the application
start:
	BLOCK_RANGE=$(BLOCK_RANGE) npm start

# Run tests
test:
	npm test

# Run tests in watch mode
test-watch:
	npm run test:watch

# Clean build artifacts and dependencies
clean:
	rm -rf dist
	rm -rf node_modules

# Show help message
help:
	@echo "MegaETH Testnet Statistics - Makefile Commands"
	@echo ""
	@echo "Available targets:"
	@echo "  make install      - Install npm dependencies"
	@echo "  make build        - Compile TypeScript to JavaScript"
	@echo "  make start        - Run the application"
	@echo "  make test         - Run tests"
	@echo "  make test-watch   - Run tests in watch mode"
	@echo "  make clean        - Remove dist/ and node_modules/"
	@echo "  make help         - Show this help message"
	@echo ""
	@echo "Examples:"
	@echo "  make start                    - Run with default 100 blocks"
	@echo "  BLOCK_RANGE=50 make start    - Run analyzing 50 blocks"

