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

### Lockup Functions

#### `lockTokens(wallet, connection, lockupForPubkey, amount)`

Lock tokens using any wallet adapter.

##### Parameters

- `wallet`: A wallet adapter with `publicKey` and `sendTransaction` properties
- `connection`: A Solana Connection instance
- `lockupForPubkey`: The public key to lock PAL tokens for
- `amount`: Number of tokens to lock (in tokens, not raw units)

##### Returns

Promise that resolves to an object with:
- `signature`: Transaction signature
- `confirm`: Function that returns a promise for transaction confirmation

#### `unlockTokens(wallet, connection, lockupAccount)`

Unlock tokens that were previously locked.

##### Parameters

- `wallet`: A wallet adapter with `publicKey` and `sendTransaction` properties
- `connection`: A Solana Connection instance
- `lockupAccount`: The public key of the lockup account to unlock

##### Returns

Promise that resolves to an object with:
- `signature`: Transaction signature
- `confirm`: Function that returns a promise for transaction confirmation

#### `withdrawTokensLockup(wallet, connection, lockupAccount)`

Withdraw tokens from a previously unlocked lockup.

##### Parameters

- `wallet`: A wallet adapter with `publicKey` and `sendTransaction` properties
- `connection`: A Solana Connection instance
- `lockupAccount`: The public key of the lockup account to withdraw from

##### Returns

Promise that resolves to an object with:
- `signature`: Transaction signature
- `confirm`: Function that returns a promise for transaction confirmation

### Validator Staking Functions

#### `initializeValidatorStake(wallet, connection, validatorPubkey)`

Initialize validator staking for a specific validator. This must be called once per validator before staking.

##### Parameters

- `wallet`: A wallet adapter with `publicKey` and `sendTransaction` properties
- `connection`: A Solana Connection instance
- `validatorPubkey`: The validator's identity public key

##### Returns

Promise that resolves to an object with:
- `signature`: Transaction signature
- `confirm`: Function that returns a promise for transaction confirmation

##### Example

```typescript
import { initializeValidatorStake } from "@paladin-bladesmith/sdk";
import { Connection, PublicKey } from "@solana/web3.js";

const connection = new Connection("https://api.mainnet-beta.solana.com");
const validatorIdentity = new PublicKey("..."); // Validator's identity key

const { signature, confirm } = await initializeValidatorStake(
  wallet, 
  connection,
  validatorIdentity
);

await confirm();
```

#### `validatorStakeTokens(wallet, connection, validatorIdentityPubkey, amount)`

Stake PAL tokens to a validator.

##### Parameters

- `wallet`: A wallet adapter with `publicKey` and `sendTransaction` properties
- `connection`: A Solana Connection instance
- `validatorIdentityPubkey`: The validator's identity public key
- `amount`: Number of tokens to stake (in tokens, not raw units)

##### Returns

Promise that resolves to an object with:
- `signature`: Transaction signature
- `confirm`: Function that returns a promise for transaction confirmation

##### Example

```typescript
import { validatorStakeTokens } from "@paladin-bladesmith/sdk";
import { Connection, PublicKey } from "@solana/web3.js";

const connection = new Connection("https://api.mainnet-beta.solana.com");
const validatorIdentity = new PublicKey("..."); // Validator's identity key
const amount = 100; // 100 PAL tokens

const { signature, confirm } = await validatorStakeTokens(
  wallet, 
  connection,
  validatorIdentity, 
  amount
);

await confirm();
```

#### `unstakeValidatorTokens(wallet, connection, validatorPubkey, amount)`

Unstake PAL tokens from a validator.

##### Parameters

- `wallet`: A wallet adapter with `publicKey` and `sendTransaction` properties
- `connection`: A Solana Connection instance
- `validatorPubkey`: The validator's identity public key
- `amount`: Number of tokens to unstake (in tokens, not raw units)

##### Returns

Promise that resolves to an object with:
- `signature`: Transaction signature
- `confirm`: Function that returns a promise for transaction confirmation

##### Example

```typescript
import { unstakeValidatorTokens } from "@paladin-bladesmith/sdk";
import { Connection, PublicKey } from "@solana/web3.js";

const connection = new Connection("https://api.mainnet-beta.solana.com");
const validatorIdentity = new PublicKey("..."); // Validator's identity key
const amount = 50; // 50 PAL tokens

const { signature, confirm } = await unstakeValidatorTokens(
  wallet, 
  connection,
  validatorIdentity, 
  amount
);

await confirm();
```

## License

Apache 2.0
