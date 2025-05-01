import { useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Commitment } from '@solana/web3.js';
import { makeLockupTransaction } from '../actions/lockup';

/**
 * React hook for locking tokens using the connected wallet
 * 
 * This hook is designed to work with the Solana wallet adapter for React
 * and provides a simplified interface for locking tokens.
 * 
 * @returns Object containing lock function and ready state
 */
export function useLockup() {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  
  const lock = useCallback(async (amount: number) => {
    if (!publicKey) {
      throw new Error('Wallet not connected');
    }
    
    try {
      // Convert to proper units (9 decimals because $PAL is 9 decimals)
      const rawAmount = amount * 10 ** 9;
      
      // Create the transaction
      const transaction = await makeLockupTransaction(
        publicKey,
        rawAmount,
        connection
      );
      
      // Send the transaction through the wallet adapter
      const signature = await sendTransaction(transaction, connection);
      
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
  }, [publicKey, sendTransaction, connection]);
  
  return { lock, isReady: !!publicKey };
} 