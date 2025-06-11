import { 
  PublicKey, 
  ComputeBudgetProgram, 
  TransactionInstruction, 
  VersionedTransaction, 
  TransactionMessage, 
  Connection
} from "@solana/web3.js";
import { 
  TOKEN_2022_PROGRAM_ID, 
  getAssociatedTokenAddressSync 
} from "@solana/spl-token";
import { 
  STAKE_PROGRAM_ID, 
  STAKE_CONFIG, 
  STAKE_VAULT,
  STAKE_VAULT_HOLDER_REWARDS,
  PAL_MINT
} from "../../../utils/constants";
import { getStakeInstructionDetails } from "../../../utils/helpers";
import { findValidatorStakePda, getValidatorVoteAccount } from "./utils";
import { Buffer } from "buffer";

/**
 * Creates a stake instruction for validator staking
 * @param params The stake instruction parameters
 * @returns Transaction instruction for staking to a validator
 */
export function getValidatorStakeTokensInstruction({
  userAuthority,
  validatorIdentity,
  validatorStakePubkey,
  sourceTokenAccount,
  amount,
}: {
  userAuthority: PublicKey;
  validatorIdentity: PublicKey;
  validatorStakePubkey: PublicKey;
  sourceTokenAccount: PublicKey;
  amount: number;
}): TransactionInstruction {
  // Get instruction details from IDL
  const instruction = getStakeInstructionDetails("ValidatorStakeTokens");
  
  // Create the instruction data buffer
  // ValidatorStakeTokens has discriminant value 2 and takes a u64 amount argument
  const discriminatorBuffer = Buffer.from([instruction.discriminant.value]);
  
  // Convert amount to 8-byte little-endian buffer
  const amountBuffer = Buffer.alloc(8);
  amountBuffer.writeBigUInt64LE(BigInt(amount));
  
  const data = Buffer.concat([discriminatorBuffer, amountBuffer]);

  // Define account metas based on IDL structure
  const keys = [
    { pubkey: STAKE_CONFIG, isSigner: false, isWritable: true }, // config
    { pubkey: validatorStakePubkey, isSigner: false, isWritable: true }, // validatorStake
    { pubkey: validatorIdentity, isSigner: false, isWritable: true }, // validatorStakeAuthority
    { pubkey: sourceTokenAccount, isSigner: false, isWritable: true }, // sourceTokenAccount
    { pubkey: userAuthority, isSigner: true, isWritable: false }, // sourceTokenAccountAuthority
    { pubkey: PAL_MINT, isSigner: false, isWritable: false }, // mint
    { pubkey: STAKE_VAULT, isSigner: false, isWritable: true }, // vault
    { pubkey: STAKE_VAULT_HOLDER_REWARDS, isSigner: false, isWritable: true }, // vaultHolderRewards
    { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false }, // tokenProgram
  ];

  return new TransactionInstruction({
    keys,
    programId: STAKE_PROGRAM_ID,
    data,
  });
}

/**
 * Creates a complete stake transaction for validator staking
 * @param account The wallet public key or address string
 * @param validatorIdentityKey The validator's identity public key
 * @param amount The amount to stake
 * @param connection Solana connection instance
 * @returns A versioned transaction ready for signing
 */
export async function makeValidatorStakeTokensTransaction(
  account: PublicKey | string,
  validatorIdentityKey: PublicKey | string,
  amount: number,
  connection: Connection
): Promise<VersionedTransaction> {
  // Convert string to PublicKey if needed
  const userPubkey = typeof account === 'string' ? new PublicKey(account) : account;
  const validatorIdentity = typeof validatorIdentityKey === 'string' 
    ? new PublicKey(validatorIdentityKey) 
    : validatorIdentityKey;
  
  if (!userPubkey) throw new Error("Account is required");
  console.log("User pubkey:", userPubkey.toBase58());
  
  // Get the vote account from the validator identity
  const validatorVotePubkey = await getValidatorVoteAccount(connection, validatorIdentity);
  if (!validatorVotePubkey) {
    throw new Error(`Could not find vote account for validator identity: ${validatorIdentity.toBase58()}`);
  }
  
  console.log("Validator vote pubkey:", validatorVotePubkey.toBase58());
  
  // Derive the validator stake PDA using the same seeds as the initializeValidatorStake
  const [validatorStakePda] = findValidatorStakePda(
    validatorVotePubkey,
    STAKE_CONFIG,
    STAKE_PROGRAM_ID
  );
  
  console.log("Validator stake PDA:", validatorStakePda.toBase58());
  
  // Get the user's PAL token account
  const sourceTokenAccount = getAssociatedTokenAddressSync(
    PAL_MINT,
    userPubkey,
    true,
    TOKEN_2022_PROGRAM_ID
  );
  
  console.log("Source token account:", sourceTokenAccount.toBase58());
  
  // Create the stake instruction
  const stakeIx = getValidatorStakeTokensInstruction({
    userAuthority: userPubkey,
    validatorIdentity,
    validatorStakePubkey: validatorStakePda,
    sourceTokenAccount,
    amount,
  });
  
  // Add compute budget instructions
  const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({
    units: 400_000
  });

  const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: 1000,
  });
  
  // Get the latest blockhash
  const { blockhash } = await connection.getLatestBlockhash();
  
  // Create a transaction message
  const messageV0 = new TransactionMessage({
    payerKey: userPubkey,
    recentBlockhash: blockhash,
    instructions: [computeBudgetIx, addPriorityFee, stakeIx]
  }).compileToV0Message();
  
  // Create the versioned transaction
  const tx = new VersionedTransaction(messageV0);
  
  return tx;
} 