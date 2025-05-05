import { Connection, PublicKey, VersionedTransaction, Commitment } from '@solana/web3.js';
import { makeLockupTransaction } from '../actions/lockup';

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
 * @param lockupForPubkey The pubkey to lock PAL for
 * @param amount Amount of tokens to lock (in tokens, not raw units)
 * @returns Object containing signature and confirm function
 */
export async function lockTokens(
  wallet: WalletAdapter,
  connection: Connection,
  lockupForPubkey: PublicKey | string,
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
      connection,
      lockupForPubkey
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