# Unstake Tokens Support

This SDK now supports unstaking tokens from both validator and SOL staker stakes.

## Overview

The `unstakeTokens` instruction allows users to unstake their PAL tokens from either:
- Validator stakes
- SOL staker stakes

## Usage

### Unstaking from Validator

```typescript
import { unstakeValidatorTokens } from '@paladin/sdk';
import { Connection, PublicKey } from '@solana/web3.js';

const connection = new Connection('https://api.mainnet-beta.solana.com');
const validatorIdentity = new PublicKey('VALIDATOR_IDENTITY_PUBKEY');
const amount = BigInt(1_000_000_000); // 1 PAL (9 decimals)

const result = await unstakeValidatorTokens(
  wallet,
  connection,
  validatorIdentity,
  amount
);

// Wait for confirmation
await result.confirm();
```

### Unstaking from SOL Staker

```typescript
import { unstakeSolStakerTokens } from '@paladin/sdk';
import { Connection } from '@solana/web3.js';

const connection = new Connection('https://api.mainnet-beta.solana.com');
const amount = BigInt(1_000_000_000); // 1 PAL (9 decimals)

const result = await unstakeSolStakerTokens(
  wallet,
  connection,
  amount
);

// Wait for confirmation
await result.confirm();
```

## Implementation Details

### Account Structure

The unstake instruction requires the following accounts:
- `config`: The stake configuration account (STAKE_CONFIG)
- `stake`: The validator/SOL staker stake account (derived PDA)
- `stakeAuthority`: The user's wallet (must sign)
- `vault`: The stake vault (STAKE_VAULT)
- `vaultAuthority`: The vault authority (derived PDA)
- `vaultHolderRewards`: The vault holder rewards account
- `mint`: The PAL mint
- `destinationTokenAccount`: The user's PAL associated token account
- `tokenProgram`: The SPL Token 2022 program

### Key Features

1. **Automatic Stake Account Discovery**: 
   - For validators: Uses the validator identity to find the vote account, then derives the stake PDA
   - For SOL stakers: Finds all native SOL stake accounts owned by the user and uses the first one

2. **Automatic PDA Derivation**:
   - Validator stake PDA: `["validator_stake", vote_pubkey, config]`
   - SOL staker stake PDA: `["sol_staker_stake", native_stake_pubkey, config]`
   - Vault authority PDA: `["vault_authority", vault_pubkey]`

3. **Token Handling**:
   - Automatically determines the destination token account (user's PAL ATA)
   - Uses TOKEN_2022_PROGRAM_ID for PAL token transfers

### Constants Used

- `STAKE_CONFIG`: The main stake configuration account
- `STAKE_VAULT`: The stake vault holding staked tokens
- `STAKE_VAULT_HOLDER_REWARDS`: The holder rewards account for the vault
- `PAL_MINT`: The PAL token mint
- `STAKE_PROGRAM_ID`: The Paladin stake program

## Error Handling

The functions will throw errors in the following cases:
- Wallet not connected
- No vote account found for the validator identity
- No SOL stake accounts found for the user (SOL staker)
- Transaction creation or sending fails

## Notes

- The amount parameter is in the smallest unit (1 PAL = 1_000_000_000 units)
- The functions return an object with the transaction signature and a `confirm` helper
- For SOL stakers, the implementation currently uses the first found stake account. In production, you may want to let users choose which stake account to unstake from.