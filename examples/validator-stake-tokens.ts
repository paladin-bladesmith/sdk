import { Connection, PublicKey } from '@solana/web3.js';
import { validatorStakeTokens, makeValidatorStakeTokensTransaction } from '../src';

// Example 1: Using the high-level functional API with wallet adapter
async function stakeTokensWithWallet() {
  // Assuming you have a wallet adapter instance (e.g., from @solana/wallet-adapter-react)
  const wallet = getWalletSomehow(); // Your wallet adapter instance
  const connection = new Connection('https://api.mainnet-beta.solana.com');
  
  // The validator's identity public key (not the vote account)
  const validatorIdentity = new PublicKey('ValidatorIdentityPubkeyHere');
  
  // Amount to stake in smallest units (e.g., for 100 PAL tokens with 9 decimals)
  const amount = 100_000_000_000; // 100 PAL
  
  try {
    const result = await validatorStakeTokens(
      wallet,
      connection,
      validatorIdentity,
      amount
    );
    
    console.log('Transaction signature:', result.signature);
    
    // Wait for confirmation
    await result.confirm();
    console.log('Tokens staked successfully!');
  } catch (error) {
    console.error('Failed to stake tokens:', error);
  }
}

// Example 2: Using the lower-level transaction builder
async function stakeTokensManually() {
  const connection = new Connection('https://api.mainnet-beta.solana.com');
  
  // Your wallet's public key
  const userWallet = new PublicKey('YourWalletPubkeyHere');
  
  // The validator's identity public key
  const validatorIdentity = new PublicKey('ValidatorIdentityPubkeyHere');
  
  // Amount to stake
  const amount = 100_000_000_000; // 100 PAL
  
  try {
    // Create the transaction
    const transaction = await makeValidatorStakeTokensTransaction(
      userWallet,
      validatorIdentity,
      amount,
      connection
    );
    
    // Sign and send the transaction using your preferred method
    // For example, with a keypair:
    // transaction.sign([yourKeypair]);
    // const signature = await connection.sendTransaction(transaction);
    
    console.log('Transaction created successfully');
  } catch (error) {
    console.error('Failed to create transaction:', error);
  }
}

// Helper function placeholder - replace with your actual wallet adapter
function getWalletSomehow(): any {
  throw new Error('Replace this with your actual wallet adapter instance');
}