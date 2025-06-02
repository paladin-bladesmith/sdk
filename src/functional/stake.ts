import { 
  Connection, 
  PublicKey,
  // Commitment 
} from '@solana/web3.js';
// import { makeValidatorInitializeTransaction } from '../actions/stake/validator/initialize';
import { Wallet } from "@solana/wallet-adapter-react";

/**
 * Initialize validator staking using the provided wallet adapter
 * 
 * This function provides a simplified, non-React interface for initializing validator staking
 * similar to the lockup functions.
 * 
 * @param wallet Wallet interface with publicKey and sendTransaction
 * @param connection Solana connection
 * @param validatorPubkey The validator vote public key to initialize
 * @returns Object containing signature and confirm function
 */
export async function initializeValidatorStake(
  _wallet: Wallet,
  _connection: Connection,
  _validatorPubkey: PublicKey | string
) {
  // if (!wallet.adapter.publicKey) {
  //   throw new Error('Wallet not connected');
  // }
  
  // try {
  //   // Create the transaction
  //   const transaction = await makeValidatorInitializeTransaction(
  //     wallet.adapter.publicKey,
  //     validatorPubkey,
  //     connection
  //   );
    
  //   // Send the transaction through the wallet adapter
  //   const signature = await wallet.adapter.sendTransaction(transaction, connection);
    
  //   // Get latest blockhash for transaction confirmation
  //   const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    
  //   // Return both signature and a helper for waiting for confirmation
  //   return {
  //     signature,
  //     confirm: async (commitment: Commitment = 'confirmed') => {
  //       // Use the proper confirmation strategy object
  //       return connection.confirmTransaction(
  //         {
  //           signature,
  //           blockhash,
  //           lastValidBlockHeight
  //         },
  //         commitment
  //       );
  //     }
  //   };
  // } catch (error) {
  //   console.error('Validator stake initialization failed:', error);
  //   throw error;
  // }
}
