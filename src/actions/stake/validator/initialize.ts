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
export function getValidatorInitializeInstruction({
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
 * @param validatorPubkey The validator vote public key to initialize
 * @param connection Solana connection instance
 * @returns A versioned transaction ready for signing
 */
export async function makeValidatorInitializeTransaction(
  account: PublicKey | string,
  validatorPubkey: PublicKey | string,
  connection: Connection
): Promise<VersionedTransaction> {
  // Convert string to PublicKey if necessary
  const pubkey = typeof account === 'string' ? new PublicKey(account) : account;
  // TODO: Get vote pubkey from 
  const validatorVotePubkey = typeof validatorPubkey === 'string' ? new PublicKey(validatorPubkey) : validatorPubkey;
  
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
  
  // Create a transaction message
  const messageV0 = new TransactionMessage({
    payerKey: pubkey,
    recentBlockhash: blockhash,
    instructions: [computeBudgetIx, addPriorityFee, createAccountIx]
  }).compileToV0Message();
  
  // Create the versioned transaction
  const tx = new VersionedTransaction(messageV0);
  
  // Add the stake account keypair as a signer
  tx.sign([validatorStakeAccount]);
  
  return tx;
}