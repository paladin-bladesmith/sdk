import { 
  Connection, 
  PublicKey,
  Commitment 
} from '@solana/web3.js';
import { makeValidatorInitializeTransaction } from '../actions/stake/validator/initialize';
import { makeValidatorStakeTokensTransaction } from '../actions/stake/validator/stake';
import { makeValidatorUnstakeTransaction } from '../actions/stake/validator/unstake';
import { makeSolStakerUnstakeTransaction } from '../actions/stake/solstaker/unstake';
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
  wallet: Wallet,
  connection: Connection,
  validatorPubkey: PublicKey | string
) {
  if (!wallet.adapter.publicKey) {
    throw new Error('Wallet not connected');
  }
  
  try {
    // Create the transaction
    const transaction = await makeValidatorInitializeTransaction(
      wallet.adapter.publicKey,
      validatorPubkey,
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
    console.error('Validator stake initialization failed:', error);
    throw error;
  }
}

/**
 * Stake tokens to a validator using the provided wallet adapter
 * 
 * This function provides a simplified, non-React interface for staking tokens
 * to a validator, similar to the initializeValidatorStake function.
 * 
 * @param wallet Wallet interface with publicKey and sendTransaction
 * @param connection Solana connection
 * @param validatorIdentityPubkey The validator identity public key to stake to
 * @param amount The amount of tokens to stake (in smallest units)
 * @returns Object containing signature and confirm function
 */
export async function validatorStakeTokens(
  wallet: Wallet,
  connection: Connection,
  validatorIdentityPubkey: PublicKey | string,
  amount: number
) {

  // Convert to proper units (9 decimals because $PAL is 9 decimals)
  amount = amount * 10 ** 9;

  if (!wallet.adapter.publicKey) {
    throw new Error('Wallet not connected');
  }
  
  try {
    // Create the transaction
    const transaction = await makeValidatorStakeTokensTransaction(
      wallet.adapter.publicKey,
      validatorIdentityPubkey,
      amount,
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
    console.error('Validator stake tokens failed:', error);
    throw error;
  }
}

/**
 * Unstake tokens from validator staking using the provided wallet adapter
 * 
 * @param wallet Wallet interface with publicKey and sendTransaction
 * @param connection Solana connection
 * @param validatorPubkey The validator identity public key
 * @param amount The amount of tokens to unstake (as a bigint)
 * @returns Object containing signature and confirm function
 */
export async function unstakeValidatorTokens(
  wallet: Wallet,
  connection: Connection,
  validatorPubkey: PublicKey | string,
  amount: number
) {
  console.log("[TEST] Unstaking validator tokens", validatorPubkey, amount);

  if (!wallet.adapter.publicKey) {
    throw new Error('Wallet not connected');
  }
  
  try {
    // Create the transaction
    const transaction = await makeValidatorUnstakeTransaction(
      wallet.adapter.publicKey,
      validatorPubkey,
      amount,
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
    console.error('Validator unstake failed:', error);
    throw error;
  }
}

/**
 * Unstake tokens from SOL staker staking using the provided wallet adapter
 * 
 * @param wallet Wallet interface with publicKey and sendTransaction
 * @param connection Solana connection
 * @param solStakerStake The SOL staker stake account public key
 * @param amount The amount of tokens to unstake (as a bigint)
 * @returns Object containing signature and confirm function
 */
export async function unstakeSolStakerTokens(
  wallet: Wallet,
  connection: Connection,
  solStakerStake: PublicKey | string,
  amount: bigint
) {
  if (!wallet.adapter.publicKey) {
    throw new Error('Wallet not connected');
  }
  
  try {
    // Create the transaction
    const transaction = await makeSolStakerUnstakeTransaction(
      wallet.adapter.publicKey,
      solStakerStake,
      amount,
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
    console.error('SOL staker unstake failed:', error);
    throw error;
  }
}