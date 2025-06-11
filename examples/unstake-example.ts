import { Connection, PublicKey } from '@solana/web3.js';
import { unstakeValidatorTokens, unstakeSolStakerTokens } from '../src';
import { Wallet } from '@solana/wallet-adapter-react';

/**
 * Example: Unstaking tokens from validator staking
 */
async function unstakeFromValidator(
  wallet: Wallet,
  connection: Connection
) {
  // Validator identity public key
  const validatorIdentity = new PublicKey('7K3UpbZViPnQDLn2DAM853B9J5GBxd1L1rLHy4KqSmWG');
  
  // Amount to unstake (1 PAL = 1_000_000_000 units)
  const amount = BigInt(1_000_000_000); // 1 PAL
  
  try {
    const result = await unstakeValidatorTokens(
      wallet,
      connection,
      validatorIdentity,
      amount
    );
    
    console.log('Transaction signature:', result.signature);
    
    // Wait for confirmation
    const confirmation = await result.confirm();
    console.log('Transaction confirmed:', confirmation);
  } catch (error) {
    console.error('Failed to unstake from validator:', error);
  }
}

/**
 * Example: Unstaking tokens from SOL staker staking
 */
async function unstakeFromSolStaker(
  wallet: Wallet,
  connection: Connection
) {
  // Amount to unstake (1 PAL = 1_000_000_000 units)
  const amount = BigInt(1_000_000_000); // 1 PAL
  
  try {
    const result = await unstakeSolStakerTokens(
      wallet,
      connection,
      amount
    );
    
    console.log('Transaction signature:', result.signature);
    
    // Wait for confirmation
    const confirmation = await result.confirm();
    console.log('Transaction confirmed:', confirmation);
  } catch (error) {
    console.error('Failed to unstake from SOL staker:', error);
  }
}

// Usage example
async function main() {
  const connection = new Connection('https://api.mainnet-beta.solana.com');
  
  // Assuming you have a wallet instance from @solana/wallet-adapter-react
  // const wallet = useWallet();
  
  // Unstake from validator
  // await unstakeFromValidator(wallet, connection);
  
  // Unstake from SOL staker
  // await unstakeSolStakerTokens(wallet, connection);
}

export { unstakeFromValidator, unstakeFromSolStaker };