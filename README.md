# Paladin SDK

A TypeScript SDK for interacting with Paladin Solana programs. Designed to work with any Solana wallet adapter.

## Installation

```bash
npm install @paladin-bladesmith/sdk
# or
yarn add @paladin-bladesmith/sdk
```

## Requirements

- A Solana wallet adapter with sendTransaction capability
- Solana web3.js

## Usage

The SDK provides a simple function-based API for interacting with Paladin protocols:

```typescript
import { lockTokens } from "@paladin-bladesmith/sdk";
import { Connection, PublicKey } from "@solana/web3.js";


const connection = new Connection("https://api.mainnet-beta.solana.com");
const lockupForPubkey = new PublicKey("..."); // The pubkey to lock PAL for

const { signature, confirm } = await lockTokens(wallet, connection, lockupForPubkey, amount);
```

## API Reference

### `lockTokens(wallet, connection, lockupForPubkey, amount)`

A function for locking tokens using any wallet adapter.

#### Parameters

- `wallet`: A wallet adapter with `publicKey` and `sendTransaction` properties
- `connection`: A Solana Connection instance
- `lockupForPubkey`: The public key to lock PAL tokens for
- `amount`: Number of tokens to lock (in tokens, not raw units)

#### Returns

Promise that resolves to an object with:
- `signature`: Transaction signature
- `confirm`: Function that returns a promise for transaction confirmation

## License

Apache 2.0
