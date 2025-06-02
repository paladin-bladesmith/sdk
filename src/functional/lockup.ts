import { Connection, PublicKey, Commitment } from '@solana/web3.js';
import { makeLockupTransaction } from '../actions/lockup/lock';
import { makeUnlockTransaction } from '../actions/lockup/unlock';
import { makeWithdrawTransaction } from '../actions/lockup/withdraw';
import { Wallet } from "@solana/wallet-adapter-react";

/**
 * Lock tokens using the provided wallet adapter
 * 
 * This function provides a simplified, non-React interface for locking tokens
 * similar to the useLockup hook but without React dependencies.
 * 
 * @param wallet Wallet interface with publicKey and sendTransaction
 * @param connection Solana connection
 * @param lockupForPubkey The pubkey to lock PAL for
 * @param amount Amount of tokens to lock (in tokens, not raw units)
 * @returns Object containing signature and confirm function
 */
export async function lockTokens(
  wallet: Wallet,
  connection: Connection,
  lockupForPubkey: PublicKey | string,
  amount: number
) {
  if (!wallet.adapter.publicKey) {
    throw new Error('Wallet not connected');
  }
  
  try {
    // Convert to proper units (9 decimals because $PAL is 9 decimals)
    const rawAmount = amount * 10 ** 9;
    
    // Create the transaction
    const transaction = await makeLockupTransaction(
      wallet.adapter.publicKey,
      rawAmount,
      connection,
      lockupForPubkey
    );
    
    // Send the transaction through the wallet adapter
    const signature = await wallet.adapter.sendTransaction(transaction, connection);
    
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
 * Unlock tokens that were previously locked
 * 
 * This function provides a simplified, non-React interface for unlocking tokens
 * similar to lockTokens but without React dependencies.
 * 
 * @param wallet Wallet interface with publicKey and sendTransaction
 * @param connection Solana connection
 * @param lockupAccount The pubkey of the lockup account to unlock
 * @returns Object containing signature and confirm function
 */
export async function unlockTokens(
  wallet: Wallet,
  connection: Connection,
  lockupAccount: PublicKey | string
) {
  if (!wallet.adapter.publicKey) {
    throw new Error('Wallet not connected');
  }
  
  try {
    // Create the transaction
    const transaction = await makeUnlockTransaction(
      wallet.adapter.publicKey,
      lockupAccount,
      connection
    );
    
    // Send the transaction through the wallet adapter
    const signature = await wallet.adapter.sendTransaction(transaction, connection);
    
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
    console.error('Unlock transaction failed:', error);
    throw error;
  }
} 

/**
 * Withdraw tokens from a previously unlocked lockup
 * 
 * This function provides a simplified, non-React interface for withdrawing tokens
 * after they have been unlocked.
 * 
 * @param wallet Wallet interface with publicKey and sendTransaction
 * @param connection Solana connection
 * @param lockupAccount The pubkey of the lockup account to withdraw from
 * @returns Object containing signature and confirm function
 */
export async function withdrawTokensLockup(
  wallet: Wallet,
  connection: Connection,
  lockupAccount: PublicKey | string
) {
  if (!wallet.adapter.publicKey) {
    throw new Error('Wallet not connected');
  }
  
  try {
    // Create the transaction
    const transaction = await makeWithdrawTransaction(
      wallet.adapter.publicKey,
      lockupAccount,
      connection
    );
    
    // Send the transaction through the wallet adapter
    const signature = await wallet.adapter.sendTransaction(transaction, connection);
    
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
    console.error('Withdraw transaction failed:', error);
    throw error;
  }
}