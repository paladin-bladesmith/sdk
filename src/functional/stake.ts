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
    
    // Development mode: Force bypass wallet simulation
    const FORCE_NO_SIMULATION = process.env.NODE_ENV === 'development' || process.env.REACT_APP_FORCE_NO_SIM === 'true';
    
    if (FORCE_NO_SIMULATION) {
      console.log('🚨 DEVELOPMENT MODE: Bypassing all wallet simulation');
      
      // Sign transaction but don't let wallet send it
      let signedTransaction;
      
      // Check if wallet supports signTransaction (most modern wallets do)
      if ('signTransaction' in wallet && typeof wallet.signTransaction === 'function') {
        signedTransaction = await wallet.signTransaction(transaction);
      } else if (wallet.adapter && 'signTransaction' in wallet.adapter && typeof wallet.adapter.signTransaction === 'function') {
        signedTransaction = await wallet.adapter.signTransaction(transaction);
      } else {
        throw new Error('Wallet does not support transaction signing - cannot bypass simulation');
      }
      
      // Send directly to chain, no simulation
      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize(),
        {
          skipPreflight: true,
          preflightCommitment: 'processed',
          maxRetries: 3
        }
      );
      
      console.log('🚀 Transaction sent directly to chain:', signature);
      
      // Get latest blockhash for transaction confirmation
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      
      return {
        signature,
        confirm: async (commitment: Commitment = 'confirmed') => {
          return connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, commitment);
        }
      };
    }
    
    // Normal flow with wallet simulation checks
    // Sign the transaction with the wallet but bypass all simulation
    let signedTransaction;
    
    // Check if wallet supports signTransaction (most modern wallets do)
    if ('signTransaction' in wallet && typeof wallet.signTransaction === 'function') {
      signedTransaction = await wallet.signTransaction(transaction);
    } else if (wallet.adapter && 'signTransaction' in wallet.adapter && typeof wallet.adapter.signTransaction === 'function') {
      signedTransaction = await wallet.adapter.signTransaction(transaction);
    } else {
      // Fallback to sendTransaction if no direct signing available (this will simulate)
      const signature = await wallet.adapter.sendTransaction(transaction, connection, { skipPreflight: true });
      return {
        signature,
        confirm: async (commitment: Commitment = 'confirmed') => {
          const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
          return connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, commitment);
        }
      };
    }
    
    // Send directly to bypass wallet simulation completely
    const signature = await connection.sendRawTransaction(
      signedTransaction.serialize(),
      {
        skipPreflight: true,
        preflightCommitment: 'processed',
        maxRetries: 3
      }
    );
    
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
    
    // Development mode: Force bypass wallet simulation
    const FORCE_NO_SIMULATION = process.env.NODE_ENV === 'development' || process.env.REACT_APP_FORCE_NO_SIM === 'true';
    
    if (FORCE_NO_SIMULATION) {
      console.log('🚨 DEVELOPMENT MODE: Bypassing all wallet simulation');
      
      // Sign transaction but don't let wallet send it
      let signedTransaction;
      
      // Check if wallet supports signTransaction (most modern wallets do)
      if ('signTransaction' in wallet && typeof wallet.signTransaction === 'function') {
        signedTransaction = await wallet.signTransaction(transaction);
      } else if (wallet.adapter && 'signTransaction' in wallet.adapter && typeof wallet.adapter.signTransaction === 'function') {
        signedTransaction = await wallet.adapter.signTransaction(transaction);
      } else {
        throw new Error('Wallet does not support transaction signing - cannot bypass simulation');
      }
      
      // Send directly to chain, no simulation
      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize(),
        {
          skipPreflight: true,
          preflightCommitment: 'processed',
          maxRetries: 3
        }
      );
      
      console.log('🚀 Transaction sent directly to chain:', signature);
      
      // Get latest blockhash for transaction confirmation
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      
      return {
        signature,
        confirm: async (commitment: Commitment = 'confirmed') => {
          return connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, commitment);
        }
      };
    }
    
    // Normal flow with wallet simulation checks
    // Sign the transaction with the wallet but bypass all simulation
    let signedTransaction;
    
    // Check if wallet supports signTransaction (most modern wallets do)
    if ('signTransaction' in wallet && typeof wallet.signTransaction === 'function') {
      signedTransaction = await wallet.signTransaction(transaction);
    } else if (wallet.adapter && 'signTransaction' in wallet.adapter && typeof wallet.adapter.signTransaction === 'function') {
      signedTransaction = await wallet.adapter.signTransaction(transaction);
    } else {
      // Fallback to sendTransaction if no direct signing available (this will simulate)
      const signature = await wallet.adapter.sendTransaction(transaction, connection, { skipPreflight: true });
      return {
        signature,
        confirm: async (commitment: Commitment = 'confirmed') => {
          const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
          return connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, commitment);
        }
      };
    }
    
    // Send directly to bypass wallet simulation completely
    const signature = await connection.sendRawTransaction(
      signedTransaction.serialize(),
      {
        skipPreflight: true,
        preflightCommitment: 'processed',
        maxRetries: 3
      }
    );
    
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
    
    // Development mode: Force bypass wallet simulation
    const FORCE_NO_SIMULATION = true;
    
    if (FORCE_NO_SIMULATION) {
      console.log('🚨 DEVELOPMENT MODE: Bypassing all wallet simulation');
      
      // Sign transaction but don't let wallet send it
      let signedTransaction;
      
      // Check if wallet supports signTransaction (most modern wallets do)
      if ('signTransaction' in wallet && typeof wallet.signTransaction === 'function') {
        signedTransaction = await wallet.signTransaction(transaction);
      } else if (wallet.adapter && 'signTransaction' in wallet.adapter && typeof wallet.adapter.signTransaction === 'function') {
        signedTransaction = await wallet.adapter.signTransaction(transaction);
      } else {
        throw new Error('Wallet does not support transaction signing - cannot bypass simulation');
      }
      
      // Send directly to chain, no simulation
      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize(),
        {
          skipPreflight: true,
          preflightCommitment: 'processed',
          maxRetries: 3
        }
      );
      
      console.log('🚀 Transaction sent directly to chain:', signature);
      
      // Get latest blockhash for transaction confirmation
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      
      return {
        signature,
        confirm: async (commitment: Commitment = 'confirmed') => {
          return connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, commitment);
        }
      };
    }
    
    // Normal flow with wallet simulation checks
    // Sign the transaction with the wallet but bypass all simulation
    let signedTransaction;
    
    // Check if wallet supports signTransaction (most modern wallets do)
    if ('signTransaction' in wallet && typeof wallet.signTransaction === 'function') {
      signedTransaction = await wallet.signTransaction(transaction);
    } else if (wallet.adapter && 'signTransaction' in wallet.adapter && typeof wallet.adapter.signTransaction === 'function') {
      signedTransaction = await wallet.adapter.signTransaction(transaction);
    } else {
      // Fallback to sendTransaction if no direct signing available (this will simulate)
      const signature = await wallet.adapter.sendTransaction(transaction, connection, { skipPreflight: true });
      return {
        signature,
        confirm: async (commitment: Commitment = 'confirmed') => {
          const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
          return connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, commitment);
        }
      };
    }
    
    // Send directly to bypass wallet simulation completely
    const signature = await connection.sendRawTransaction(
      signedTransaction.serialize(),
      {
        skipPreflight: true,
        preflightCommitment: 'processed',
        maxRetries: 3
      }
    );
    
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
    
    // Development mode: Force bypass wallet simulation
    const FORCE_NO_SIMULATION = process.env.NODE_ENV === 'development' || process.env.REACT_APP_FORCE_NO_SIM === 'true';
    
    if (FORCE_NO_SIMULATION) {
      console.log('🚨 DEVELOPMENT MODE: Bypassing all wallet simulation');
      
      // Sign transaction but don't let wallet send it
      let signedTransaction;
      
      // Check if wallet supports signTransaction (most modern wallets do)
      if ('signTransaction' in wallet && typeof wallet.signTransaction === 'function') {
        signedTransaction = await wallet.signTransaction(transaction);
      } else if (wallet.adapter && 'signTransaction' in wallet.adapter && typeof wallet.adapter.signTransaction === 'function') {
        signedTransaction = await wallet.adapter.signTransaction(transaction);
      } else {
        throw new Error('Wallet does not support transaction signing - cannot bypass simulation');
      }
      
      // Send directly to chain, no simulation
      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize(),
        {
          skipPreflight: true,
          preflightCommitment: 'processed',
          maxRetries: 3
        }
      );
      
      console.log('🚀 Transaction sent directly to chain:', signature);
      
      // Get latest blockhash for transaction confirmation
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      
      return {
        signature,
        confirm: async (commitment: Commitment = 'confirmed') => {
          return connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, commitment);
        }
      };
    }
    
    // Normal flow with wallet simulation checks
    // Sign the transaction with the wallet but bypass all simulation
    let signedTransaction;
    
    // Check if wallet supports signTransaction (most modern wallets do)
    if ('signTransaction' in wallet && typeof wallet.signTransaction === 'function') {
      signedTransaction = await wallet.signTransaction(transaction);
    } else if (wallet.adapter && 'signTransaction' in wallet.adapter && typeof wallet.adapter.signTransaction === 'function') {
      signedTransaction = await wallet.adapter.signTransaction(transaction);
    } else {
      // Fallback to sendTransaction if no direct signing available (this will simulate)
      const signature = await wallet.adapter.sendTransaction(transaction, connection, { skipPreflight: true });
      return {
        signature,
        confirm: async (commitment: Commitment = 'confirmed') => {
          const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
          return connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, commitment);
        }
      };
    }
    
    // Send directly to bypass wallet simulation completely
    const signature = await connection.sendRawTransaction(
      signedTransaction.serialize(),
      {
        skipPreflight: true,
        preflightCommitment: 'processed',
        maxRetries: 3
      }
    );
    
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