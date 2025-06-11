import { 
  PublicKey, 
  ComputeBudgetProgram, 
  TransactionInstruction, 
  VersionedTransaction, 
  TransactionMessage, 
  Connection,
} from "@solana/web3.js";
import { 
  STAKE_PROGRAM_ID, 
  STAKE_CONFIG, 
  STAKE_VAULT,
  STAKE_VAULT_HOLDER_REWARDS,
  PAL_MINT,
} from "../../../utils/constants";
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { Buffer } from "buffer";
import { findValidatorStakePda, getValidatorVoteAccount } from "./utils";
import { findVaultAuthorityPda } from "../utils";
import { getStakeInstructionDetails } from "../../../utils/helpers";

/**
 * Creates an unstake instruction for validator staking
 * @param params The unstake instruction parameters
 * @returns Transaction instruction for unstaking validator tokens
 */
function getValidatorUnstakeInstruction({
  validatorStakePubkey,
  stakeAuthority,
  destinationTokenAccount,
  amount,
}: {
  validatorStakePubkey: PublicKey;
  stakeAuthority: PublicKey;
  destinationTokenAccount: PublicKey;
  amount: bigint;
}): TransactionInstruction {
  // Get instruction details from IDL
  const instruction = getStakeInstructionDetails("UnstakeTokens");
  
  // Create the instruction buffer with the discriminant value from IDL and amount
  const discriminantBuffer = Buffer.from([instruction.discriminant.value]);
  const amountBuffer = Buffer.allocUnsafe(8);
  amountBuffer.writeBigUInt64LE(amount);
  const data = Buffer.concat([discriminantBuffer, amountBuffer]);

  // Derive vault authority PDA
  const [vaultAuthority] = findVaultAuthorityPda(STAKE_VAULT, STAKE_PROGRAM_ID);

  // Define account metas based on IDL structure
  const keys = [
    { pubkey: STAKE_CONFIG, isSigner: false, isWritable: true }, // config
    { pubkey: validatorStakePubkey, isSigner: false, isWritable: true }, // stake
    { pubkey: stakeAuthority, isSigner: true, isWritable: true }, // stakeAuthority
    { pubkey: STAKE_VAULT, isSigner: false, isWritable: true }, // vault
    { pubkey: vaultAuthority, isSigner: false, isWritable: true }, // vaultAuthority
    { pubkey: STAKE_VAULT_HOLDER_REWARDS, isSigner: false, isWritable: true }, // vaultHolderRewards
    { pubkey: PAL_MINT, isSigner: false, isWritable: false }, // mint
    { pubkey: destinationTokenAccount, isSigner: false, isWritable: true }, // destinationTokenAccount
    { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false }, // tokenProgram
  ];

  return new TransactionInstruction({
    keys,
    programId: STAKE_PROGRAM_ID,
    data,
  });
}

/**
 * Creates a complete unstake transaction for validator staking
 * @param account The wallet public key or address string
 * @param validatorIdentityKey The validator's identity public key (will be used to lookup vote account)
 * @param amount The amount of tokens to unstake
 * @param connection Solana connection instance
 * @returns A versioned transaction ready for signing
 */
export async function makeValidatorUnstakeTransaction(
  account: PublicKey | string,
  validatorIdentityKey: PublicKey | string,
  amount: bigint,
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
  
  // Get the destination token account (PAL ATA for the user)
  const destinationTokenAccount = getAssociatedTokenAddressSync(
    PAL_MINT,
    pubkey
  );
  
  // Add compute budget instruction
  const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({
    units: 300_000
  });

  const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: 1000,
  });
  
  // Get the latest blockhash
  const { blockhash } = await connection.getLatestBlockhash();

  const unstakeIx = getValidatorUnstakeInstruction({
    validatorStakePubkey: validatorStakePda,
    stakeAuthority: pubkey,
    destinationTokenAccount,
    amount,
  });
  
  const instructions = [computeBudgetIx, addPriorityFee, unstakeIx];
  
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