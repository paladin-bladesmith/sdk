import { 
  PublicKey, 
  ComputeBudgetProgram, 
  TransactionInstruction, 
  VersionedTransaction, 
  TransactionMessage, 
  Connection,
  SystemProgram,
} from "@solana/web3.js";
import { Buffer } from "buffer";
import { STAKE_PROGRAM_ID, STAKE_CONFIG, VALIDATOR_STAKE_ACCOUNT_SIZE } from "../../../utils/constants";
import { findValidatorStakePda, getValidatorVoteAccount } from "./utils";
import { getStakeInstructionDetails } from "../../../utils/helpers";

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
  // Get instruction details from IDL
  const instruction = getStakeInstructionDetails("InitializeValidatorStake");
  
  // Create the instruction buffer with the discriminant value from IDL
  const data = Buffer.from([instruction.discriminant.value]);

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
  
  // Derive the validator stake PDA using the same seeds as the Rust program
  const [validatorStakePda] = findValidatorStakePda(
    validatorVotePubkey,
    STAKE_CONFIG,
    STAKE_PROGRAM_ID
  );
  
  console.log("Derived PDA:", validatorStakePda.toBase58());
  
  // Calculate rent exemption for the validator stake account
  const rentExemption = await connection.getMinimumBalanceForRentExemption(VALIDATOR_STAKE_ACCOUNT_SIZE);
  
  console.log("Rent exemption needed:", rentExemption);
  
  // Transfer lamports to the PDA address to make it rent exempt
  // This should create a system-owned account with 0 space at the PDA address
  const fundPdaIx = SystemProgram.transfer({
    fromPubkey: pubkey,
    toPubkey: validatorStakePda,
    lamports: rentExemption,
  });
  
  console.log("Transfer instruction created");
  
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
    validatorStakePubkey: validatorStakePda,
  });
  
  const instructions = [computeBudgetIx, addPriorityFee, fundPdaIx, initializeIx];
  console.log("Total instructions:", instructions.length);
  
  // Create a transaction message
  const messageV0 = new TransactionMessage({
    payerKey: pubkey,
    recentBlockhash: blockhash,
    instructions
  }).compileToV0Message();
  
  // Create the versioned transaction
  const tx = new VersionedTransaction(messageV0);
  
  return tx;
}