import { Connection, PublicKey, VersionedTransaction, Commitment } from '@solana/web3.js';
import { makeLockupTransaction } from '../actions/lockup';
import { makeValidatorStakeTransaction } from '../actions/stake';

/**
 * Interface for wallet adapter like objects that can send transactions
 */
export interface WalletAdapter {
  publicKey: PublicKey | null;
  sendTransaction: (
    transaction: VersionedTransaction,
    connection: Connection,
    options?: any
  ) => Promise<string>;
}

/**
 * Lock tokens using the provided wallet adapter
 * 
 * This function provides a simplified, non-React interface for locking tokens
 * similar to the useLockup hook but without React dependencies.
 * 
 * @param wallet Wallet adapter interface with publicKey and sendTransaction
 * @param connection Solana connection
 * @param amount Amount of tokens to lock (in tokens, not raw units)
 * @returns Object containing signature and confirm function
 */
export async function lockTokens(
  wallet: WalletAdapter,
  connection: Connection,
  amount: number
) {
  if (!wallet.publicKey) {
    throw new Error('Wallet not connected');
  }
  
  try {
    // Convert to proper units (9 decimals because $PAL is 9 decimals)
    const rawAmount = amount * 10 ** 9;
    
    // Create the transaction
    const transaction = await makeLockupTransaction(
      wallet.publicKey,
      rawAmount,
      connection
    );
    
    // Send the transaction through the wallet adapter
    const signature = await wallet.sendTransaction(transaction, connection);
    
    // Get latest blockhash for transaction confirmation
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    
    // Return both signature and a helper for waiting for confirmation
    return {
      signature,
      confirm: async (commitment: Commitment = 'confirmed') => {
        // Use the proper confirmation strategy object
        return connection.confirmTransaction(
          {
            signature,
            blockhash,
            lastValidBlockHeight
          },
          commitment
        );
      }
    };
  } catch (error) {
    console.error('Lockup transaction failed:', error);
    throw error;
  }
}

/**
 * Stake tokens in the Paladin stake program.
 * 
 * NOTE: This is an SDK for *validator* staking, not *sol staker* staking.
 * 
 * This function provides a non-React interface for staking tokens
 * 
 * @param wallet Wallet adapter interface with publicKey and sendTransaction
 * @param connection Solana connection
 * @param amount Amount of tokens to stake (in tokens, not raw units)
 * @param validatorVote The validator vote account to stake with
 * @returns Object containing signature and confirm function
 */
export async function stakeTokens(
  wallet: WalletAdapter,
  connection: Connection,
  amount: number,
  validatorVote: PublicKey
) {
  if (!wallet.publicKey) {
    throw new Error('Wallet not connected');
  }
  
  try {
    // Convert to proper units (9 decimals because $PAL is 9 decimals)
    const rawAmount = amount * 10 ** 9;
    
    // Create the transaction
    const transaction = await makeValidatorStakeTransaction(
      wallet.publicKey,
      rawAmount,
      validatorVote,
      connection
    );
    
    // Send the transaction through the wallet adapter
    const signature = await wallet.sendTransaction(transaction, connection);
    
    // Get latest blockhash for transaction confirmation
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    
    // Return both signature and a helper for waiting for confirmation
    return {
      signature,
      confirm: async (commitment: Commitment = 'confirmed') => {
        // Use the proper confirmation strategy object
        return connection.confirmTransaction(
          {
            signature,
            blockhash,
            lastValidBlockHeight
          },
          commitment
        );
      }
    };
  } catch (error) {
    console.error('Stake transaction failed:', error);
    throw error;
  }
} 