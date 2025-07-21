# Kronus - Open Source Multisig Client

Kronus is an open-source alternative to Squads.so, providing a comprehensive front-end client for multisig operations across Solana and other SVMs/alt-chains.

## Features

- **Cross-Chain Support**: Manage multisig wallets on Solana and other compatible chains
- **Comprehensive Interface**: Create, manage, and execute multisig transactions
- **Permissionless**: Open-source and free to use
- **Modern UI**: Built with Nuxt 3 for a fast, responsive experience

## About Kronus

While Squads.so provides an excellent service, Kronus aims to offer:

- A completely open-source solution
- Support for multiple blockchain networks
- Enhanced customization options
- Self-hosted deployment options
- Additional features for specialized use cases

## Supported Chains

- Sonic SVM (primary)
- Solana
- Future integrations planned for:
  - Solana Virtual Machine (SVM) compatible chains
  - Other alt-chains with compatible multisig protocols

## Setup

Make sure to install dependencies:

```bash
# bun
bun install
```

Create a new environment file:

```
cp .env.example .env
```

Get environment variables from Francis at `jose@sonic.game` and supply them in the file. 


## Development Server

Start the development server on `http://localhost:3000`:

```bash

# bun
bun run dev
```

## Production

Build the application for production:

```bash

# bun
bun run build
```

Locally preview production build:

```bash

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
