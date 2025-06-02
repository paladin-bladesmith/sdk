import { 
  PublicKey, 
  ComputeBudgetProgram, 
  TransactionInstruction, 
  VersionedTransaction, 
  TransactionMessage, 
  Connection,
  SystemProgram,
  Keypair
} from "@solana/web3.js";
import { STAKE_PROGRAM_ID, STAKE_CONFIG, VALIDATOR_STAKE_ACCOUNT_SIZE } from "../../../utils/constants";

/**
 * Creates an initialize instruction for validator staking
 * @param params The initialize instruction parameters
 * @returns Transaction instruction for initializing validator staking
 */
function getValidatorInitializeInstruction({
  validatorVotePubkey,
  validatorStakePubkey,
}: {
  validatorVotePubkey: PublicKey;
  validatorStakePubkey: PublicKey;
}): TransactionInstruction {
  // Create the instruction buffer with the discriminant value (1)
  const data = Buffer.from([1]); // Discriminant value from IDL

  // Define account metas based on IDL structure
  const keys = [
    { pubkey: STAKE_CONFIG, isSigner: false, isWritable: false }, // config
    { pubkey: validatorStakePubkey, isSigner: false, isWritable: true }, // validatorStake
    { pubkey: validatorVotePubkey, isSigner: false, isWritable: false }, // validatorVote
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // systemProgram
  ];

  return new TransactionInstruction({
    keys,
    programId: STAKE_PROGRAM_ID,
    data,
  });
}

/**
 * Creates a complete initialize transaction for validator staking
 * @param account The wallet public key or address string
 * @param validatorIdentityKey The validator's identity public key (will be used to lookup vote account)
 * @param connection Solana connection instance
 * @returns A versioned transaction ready for signing
 */
export async function makeValidatorInitializeTransaction(
  account: PublicKey | string,
  validatorIdentityKey: PublicKey | string,
  connection: Connection
): Promise<VersionedTransaction> {
  // Convert string to PublicKey if necessary
  const pubkey = typeof account === 'string' ? new PublicKey(account) : account;
  
  // Get the vote account from the validator identity
  const validatorVotePubkey = await getValidatorVoteAccount(connection, validatorIdentityKey);
  if (!validatorVotePubkey) {
    const identityStr = typeof validatorIdentityKey === 'string' 
      ? validatorIdentityKey 
      : validatorIdentityKey.toBase58();
    throw new Error(`Could not find vote account for validator identity: ${identityStr}`);
  }
  
  // Generate a new keypair for the validator stake account
  const validatorStakeAccount = Keypair.generate();
  
  // Calculate rent exemption for the validator stake account
  const rentExemption = await connection.getMinimumBalanceForRentExemption(VALIDATOR_STAKE_ACCOUNT_SIZE);
  
  // Create account instruction
  const createAccountIx = SystemProgram.createAccount({
    fromPubkey: pubkey,
    newAccountPubkey: validatorStakeAccount.publicKey,
    lamports: rentExemption,
    space: VALIDATOR_STAKE_ACCOUNT_SIZE,
    programId: STAKE_PROGRAM_ID
  });
  
  // Add compute budget instruction (optional, but provides more compute units if needed)
  const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({
    units: 300_000
  });

  const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: 1000,
  });
  
  // Get the latest blockhash
  const { blockhash } = await connection.getLatestBlockhash();

  const initializeIx = getValidatorInitializeInstruction({
    validatorVotePubkey: validatorVotePubkey,
    validatorStakePubkey: validatorStakeAccount.publicKey,
  });
  
  // Create a transaction message
  const messageV0 = new TransactionMessage({
    payerKey: pubkey,
    recentBlockhash: blockhash,
    instructions: [computeBudgetIx, addPriorityFee, createAccountIx, initializeIx]
  }).compileToV0Message();
  
  // Create the versioned transaction
  const tx = new VersionedTransaction(messageV0);
  
  // Add the stake account keypair as a signer
  tx.sign([validatorStakeAccount]);
  
  return tx;
}

/**
 * Gets the vote account public key for a given validator identity
 * @param connection Solana connection instance
 * @param validatorIdentity The validator's identity public key
 * @returns The validator's vote account public key, or null if not found
 */
export async function getValidatorVoteAccount(
  connection: Connection,
  validatorIdentity: PublicKey | string
): Promise<PublicKey | null> {
  const identityPubkey = typeof validatorIdentity === 'string' 
    ? new PublicKey(validatorIdentity) 
    : validatorIdentity;
  
  try {
    // Get all vote accounts from the cluster
    const voteAccounts = await connection.getVoteAccounts();
    
    // Search in both current and delinquent validators
    const allValidators = [...voteAccounts.current, ...voteAccounts.delinquent];
    
    // Find the validator with matching identity
    const validator = allValidators.find(
      validator => validator.nodePubkey === identityPubkey.toBase58()
    );
    
    if (validator) {
      return new PublicKey(validator.votePubkey);
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching vote accounts:', error);
    throw new Error(`Failed to get vote account for validator ${identityPubkey.toBase58()}: ${error}`);
  }
}