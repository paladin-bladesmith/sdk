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

### Locking Tokens

```typescript
import { lockTokens } from "@paladin-bladesmith/sdk";
import { Connection } from "@solana/web3.js";

async function lockMyTokens(wallet, amount) {
  const connection = new Connection("https://api.mainnet-beta.solana.com");
  
  try {
    const { signature, confirm } = await lockTokens(wallet, connection, amount);
    console.log("Transaction sent:", signature);
    
    // Wait for confirmation
    await confirm();
    console.log("Transaction confirmed!");
  } catch (error) {
    console.error("Transaction failed:", error);
  }
}
```

### Staking with Validators

```typescript
import { stakeTokens } from "@paladin-bladesmith/sdk";
import { Connection, PublicKey } from "@solana/web3.js";

async function stakeWithValidator(wallet, amount, validatorVoteAccount) {
  const connection = new Connection("https://api.mainnet-beta.solana.com");
  const validatorVote = new PublicKey(validatorVoteAccount);
  
  try {
    const { signature, confirm } = await stakeTokens(wallet, connection, amount, validatorVote);
    console.log("Transaction sent:", signature);
    
    // Wait for confirmation
    await confirm();
    console.log("Transaction confirmed!");
  } catch (error) {
    console.error("Transaction failed:", error);
  }
}
```

## API Reference

### `lockTokens(wallet, connection, amount)`

A function for locking tokens using any wallet adapter.

#### Parameters

- `wallet`: A wallet adapter with `publicKey` and `sendTransaction` properties
- `connection`: A Solana Connection instance
- `amount`: Number of tokens to lock (in tokens, not raw units)

#### Returns

Promise that resolves to an object with:
- `signature`: Transaction signature
- `confirm`: Function that returns a promise for transaction confirmation

### `stakeTokens(wallet, connection, amount, validatorVote)`

A function for staking tokens with a validator.

#### Parameters

- `wallet`: A wallet adapter with `publicKey` and `sendTransaction` properties
- `connection`: A Solana Connection instance
- `amount`: Number of tokens to stake (in tokens, not raw units)
- `validatorVote`: PublicKey of the validator vote account to stake with

#### Returns

Promise that resolves to an object with:
- `signature`: Transaction signature
- `confirm`: Function that returns a promise for transaction confirmation

## License

Apache 2.0
