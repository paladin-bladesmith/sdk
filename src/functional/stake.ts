import { Connection, PublicKey, VersionedTransaction, Commitment } from '@solana/web3.js';
import { makeValidatorInitializeTransaction } from '../actions/stake/validator/initialize';

// Placeholder exports for future stake functions 
export function placeholder() {
  throw new Error("stakeTokens not implemented");
}

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
 * Initialize validator staking using the provided wallet adapter
 * 
 * This function provides a simplified, non-React interface for initializing validator staking
 * similar to the lockup functions.
 * 
 * @param wallet Wallet adapter interface with publicKey and sendTransaction
 * @param connection Solana connection
 * @param validatorPubkey The validator vote public key to initialize
 * @returns Object containing signature and confirm function
 */
export async function initializeValidatorStake(
  wallet: WalletAdapter,
  connection: Connection,
  validatorPubkey: PublicKey | string
) {
  if (!wallet.publicKey) {
    throw new Error('Wallet not connected');
  }
  
  try {
    // Create the transaction
    const transaction = await makeValidatorInitializeTransaction(
      wallet.publicKey,
      validatorPubkey,
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
    console.error('Validator stake initialization failed:', error);
    throw error;
  }
}
